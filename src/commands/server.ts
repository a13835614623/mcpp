import { Command } from 'commander';
import chalk from 'chalk';
import { configManager } from '../core/config.js';

export const registerServerCommands = (program: Command) => {
  const listServersAction = () => {
      const servers = configManager.listServers();
      if (servers.length === 0) {
        console.log(chalk.yellow('No servers configured.'));
        return;
      }
      console.log(chalk.bold('\nConfigured Servers:'));
      servers.forEach(s => {
        console.log(`- ${chalk.cyan(s.name)} [${chalk.magenta(s.type)}]`);
        if (s.type === 'stdio') {
          console.log(`  Command: ${s.command} ${s.args.join(' ')}`);
          if (s.env) console.log(`  Env: ${Object.keys(s.env).join(', ')}`);
        } else {
          console.log(`  URL: ${s.url}`);
        }
        console.log('');
      });
  };

  // Register top-level list command
  program.command('list')
    .alias('ls')
    .description('List all configured servers')
    .action(listServersAction);

  const serverCmd = program.command('server')
    .description('Manage MCP servers');

  serverCmd.command('list')
    .alias('ls')
    .description('List all configured servers')
    .action(listServersAction);

  serverCmd.command('add <name>')
    .description('Add a new MCP server')
    .option('--type <type>', 'Server type (stdio, sse, or http)', 'stdio')
    .option('--command <command>', 'Command to execute (for stdio)')
    .option('--args [args...]', 'Arguments for the command', [])
    .option('--url <url>', 'URL for SSE/HTTP connection')
    .option('--env <env...>', 'Environment variables (KEY=VALUE)', [])
    .action((name, options) => {
      try {
        if (options.type === 'sse' || options.type === 'http') {
          if (!options.url) throw new Error(`URL is required for ${options.type} servers`);
          configManager.addServer({
            name,
            type: options.type,
            url: options.url,
          });
        } else {
          if (!options.command) throw new Error('Command is required for Stdio servers');
          
          const env: Record<string, string> = {};
          if (options.env) {
            options.env.forEach((e: string) => {
               const parts = e.split('=');
               const k = parts[0];
               const v = parts.slice(1).join('=');
               if (k && v) env[k] = v;
            });
          }

          configManager.addServer({
            name,
            type: 'stdio',
            command: options.command,
            args: options.args || [],
            env: Object.keys(env).length > 0 ? env : undefined,
          });
        }
        console.log(chalk.green(`Server "${name}" added successfully.`));
      } catch (error: any) {
        console.error(chalk.red(`Error adding server: ${error.message}`));
      }
    });

  serverCmd.command('remove <name>')
    .alias('rm')
    .description('Remove a server')
    .action((name) => {
      try {
        configManager.removeServer(name);
        console.log(chalk.green(`Server "${name}" removed.`));
      } catch (error: any) {
        console.error(chalk.red(error.message));
      }
    });

  serverCmd.command('update <name>')
    .description('Update a server')
    .option('--command <command>', 'New command')
    .option('--url <url>', 'New URL')
    .action((name, options) => {
        try {
            const updates: any = {};
            if (options.command) updates.command = options.command;
            if (options.url) updates.url = options.url;
            
            if (Object.keys(updates).length === 0) {
                console.log(chalk.yellow('No updates provided.'));
                return;
            }

            configManager.updateServer(name, updates);
            console.log(chalk.green(`Server "${name}" updated.`));
        } catch (error: any) {
            console.error(chalk.red(`Error updating server: ${error.message}`));
        }
    });
};
