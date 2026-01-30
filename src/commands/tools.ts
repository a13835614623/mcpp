import { Command } from 'commander';
import chalk from 'chalk';
import { configManager } from '../core/config.js';
import { McpClientService } from '../core/client.js';

const DAEMON_PORT = 4100;

async function tryListDaemon(serverName: string): Promise<any | null> {
  try {
    const response = await fetch(`http://localhost:${DAEMON_PORT}/list`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ server: serverName }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Daemon error');
    }

    const data = await response.json();
    return data.tools;
  } catch (error: any) {
    if (error.cause?.code === 'ECONNREFUSED' || error.message.includes('fetch failed')) {
      return null;
    }
    throw error;
  }
}

function printTools(serverName: string, tools: any) {
    console.log(chalk.bold(`\nAvailable Tools for ${serverName}:`));
    if (!tools.tools || tools.tools.length === 0) {
        console.log(chalk.yellow('No tools found.'));
    } else {
        tools.tools.forEach((tool: any) => {
            console.log(chalk.cyan(`\n- ${tool.name}`));
            if (tool.description) {
                console.log(`  ${tool.description}`);
            }
            console.log(chalk.gray('  Arguments:'));
            const schema = tool.inputSchema as any;
            if (schema.properties) {
                Object.entries(schema.properties).forEach(([key, value]: [string, any]) => {
                    const required = schema.required?.includes(key) ? chalk.red('*') : '';
                    console.log(`    ${key}${required}: ${value.type || 'any'} ${value.description ? `(${value.description})` : ''}`);
                });
            } else {
                console.log('    None');
            }
        });
    }
}

export const registerToolsCommand = (program: Command) => {
  program.command('tools <server>')
    .description('List available tools on a server')
    .action(async (serverName) => {
      // 1. Try Daemon first
      try {
        const tools = await tryListDaemon(serverName);
        if (tools) {
            // console.log(chalk.gray('(Results from Daemon)'));
            printTools(serverName, tools);
            return;
        }
      } catch (error: any) {
        console.error(chalk.red(`Daemon list failed: ${error.message}`));
        process.exit(1);
      }

      // 2. Fallback to standalone
      const serverConfig = configManager.getServer(serverName);
      if (!serverConfig) {
        console.error(chalk.red(`Server "${serverName}" not found.`));
        process.exit(1);
      }

      const client = new McpClientService();
      try {
        // console.log(chalk.gray(`Connecting to ${serverName}...`));
        await client.connect(serverConfig);
        
        const tools = await client.listTools();
        printTools(serverName, tools);
        
      } catch (error: any) {
        console.error(chalk.red(`Failed to list tools: ${error.message}`));
      } finally {
        await client.close();
      }
    });
};
