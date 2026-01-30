import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { ServerConfig } from '../types/config.js';
import { EventSource } from 'eventsource';

// Required for SSEClientTransport in Node.js environment
// @ts-ignore
global.EventSource = EventSource;

export class McpClientService {
  private client: Client | null = null;
  private transport: StdioClientTransport | SSEClientTransport | StreamableHTTPClientTransport | null = null;

  async connect(config: ServerConfig) {
    try {
      if (config.type === 'stdio') {
        const rawEnv = config.env ? { ...process.env, ...config.env } : process.env;
        const env: Record<string, string> = {};
        for (const key in rawEnv) {
            const val = rawEnv[key];
            if (typeof val === 'string') {
                env[key] = val;
            }
        }

        this.transport = new StdioClientTransport({
          command: config.command,
          args: config.args,
          env: env,
        });
      } else if (config.type === 'http') {
        this.transport = new StreamableHTTPClientTransport(new URL(config.url));
      } else {
        this.transport = new SSEClientTransport(new URL(config.url));
      }

      this.client = new Client(
        {
          name: 'mcp-cli',
          version: '1.0.0',
        },
        {
          capabilities: {},
        }
      );

      await this.client.connect(this.transport);
    } catch (error) {
      console.error(`Failed to connect to server ${config.name}:`, error);
      throw error;
    }
  }

  async listTools() {
    if (!this.client) throw new Error('Client not connected');
    return this.client.listTools();
  }

  async callTool(toolName: string, args: any) {
    if (!this.client) throw new Error('Client not connected');
    return this.client.callTool({
      name: toolName,
      arguments: args,
    });
  }

  async close() {
    if (this.transport) {
      await this.transport.close();
    }
  }
}
