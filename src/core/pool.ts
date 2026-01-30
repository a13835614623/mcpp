import { McpClientService } from './client.js';
import { configManager } from './config.js';
import { ServerConfig } from '../types/config.js';

export class ConnectionPool {
  private clients: Map<string, McpClientService> = new Map();

  async getClient(serverName: string): Promise<McpClientService> {
    if (this.clients.has(serverName)) {
      return this.clients.get(serverName)!;
    }

    const serverConfig = configManager.getServer(serverName);
    if (!serverConfig) {
      throw new Error(`Server "${serverName}" not found in config.`);
    }

    console.log(`[Daemon] Connecting to server: ${serverName}...`);
    const client = new McpClientService();
    await client.connect(serverConfig);
    this.clients.set(serverName, client);
    return client;
  }

  async closeAll() {
    for (const [name, client] of this.clients) {
      console.log(`[Daemon] Closing connection to ${name}...`);
      try {
        await client.close();
      } catch (e) {
        console.error(`[Daemon] Error closing ${name}:`, e);
      }
    }
    this.clients.clear();
  }
}

export const connectionPool = new ConnectionPool();
