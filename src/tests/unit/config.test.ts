import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { ConfigManager } from '../../core/config.js';

describe('ConfigManager', () => {
  let testConfigDir: string;
  let manager: ConfigManager;

  beforeEach(() => {
    // 创建临时配置目录
    testConfigDir = path.join(os.tmpdir(), `mcps-config-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
    fs.mkdirSync(testConfigDir, { recursive: true });

    // 创建新的 ConfigManager 实例，传入测试目录
    manager = new ConfigManager(testConfigDir);
  });

  afterEach(() => {
    // 清理临时目录
    if (fs.existsSync(testConfigDir)) {
      try {
        fs.rmSync(testConfigDir, { recursive: true, force: true });
      } catch (e) {
        // 忽略清理错误
      }
    }
  });

  describe('addServer', () => {
    it('should add a stdio server', () => {
      const serverName = 'test-stdio';
      const serverConfig = {
        command: 'node',
        args: ['--version']
      };

      manager.addServer(serverName, serverConfig);
      const servers = manager.listServers();

      expect(servers).toHaveLength(1);
      expect(servers[0].name).toBe(serverName);
      expect(servers[0].command).toBe('node');
      expect(servers[0].args).toEqual(['--version']);
    });

    it('should add an sse server', () => {
      const serverName = 'test-sse';
      const serverConfig = {
        url: 'http://localhost:3000/sse'
      };

      manager.addServer(serverName, serverConfig);
      const retrieved = manager.getServer('test-sse');

      expect(retrieved).toBeDefined();
      expect(retrieved!.name).toBe(serverName);
      expect(retrieved!.url).toBe('http://localhost:3000/sse');
    });

    it('should add an http server', () => {
      const serverName = 'test-http';
      const serverConfig = {
        url: 'http://localhost:3000/mcp'
      };

      manager.addServer(serverName, serverConfig);
      const retrieved = manager.getServer('test-http');

      expect(retrieved).toBeDefined();
      expect(retrieved!.name).toBe(serverName);
      expect(retrieved!.url).toBe('http://localhost:3000/mcp');
    });

    it('should add server with disabled flag', () => {
      const serverName = 'disabled-server';
      const serverConfig = {
        command: 'node',
        args: [] as string[],
        disabled: true
      };

      manager.addServer(serverName, serverConfig);
      const retrieved = manager.getServer('disabled-server');

      expect(retrieved).toBeDefined();
      expect(retrieved!.name).toBe('disabled-server');
      expect((retrieved as any).disabled).toBe(true);
    });

    it('should throw error when adding duplicate server', () => {
      const serverName = 'duplicate';
      const serverConfig = {
        command: 'node',
        args: [] as string[]
      };

      manager.addServer(serverName, serverConfig);

      expect(() => manager.addServer(serverName, serverConfig)).toThrow('already exists');
    });
  });

  describe('getServer', () => {
    it('should retrieve existing server', () => {
      const serverName = 'to-retrieve';
      const serverConfig = {
        command: 'node',
        args: [] as string[]
      };

      manager.addServer(serverName, serverConfig);
      const retrieved = manager.getServer('to-retrieve');

      expect(retrieved).toBeDefined();
      expect(retrieved!.name).toBe(serverName);
      expect((retrieved as any).command).toBe('node');
    });

    it('should return undefined for non-existing server', () => {
      const retrieved = manager.getServer('non-existing');

      expect(retrieved).toBeUndefined();
    });
  });

  describe('listServers', () => {
    it('should return empty array when no servers', () => {
      const servers = manager.listServers();

      expect(servers).toEqual([]);
    });

    it('should return all servers including disabled ones', () => {
      manager.addServer('server-1', {
        command: 'node',
        args: []
      });
      manager.addServer('server-2', {
        command: 'npm',
        args: ['start'],
        disabled: true
      });

      const servers = manager.listServers();

      expect(servers).toHaveLength(2);
    });
  });

  describe('removeServer', () => {
    it('should remove existing server', () => {
      manager.addServer('to-remove', {
        command: 'node',
        args: []
      });
      expect(manager.listServers()).toHaveLength(1);

      manager.removeServer('to-remove');
      expect(manager.listServers()).toHaveLength(0);
    });

    it('should throw error when removing non-existing server', () => {
      expect(() => manager.removeServer('non-existing')).toThrow('not found');
    });
  });

  describe('updateServer', () => {
    it('should update server configuration', () => {
      manager.addServer('to-update', {
        command: 'node',
        args: ['--version']
      });

      manager.updateServer('to-update', {
        command: 'npm',
        args: ['start']
      });
      const updated = manager.getServer('to-update');

      expect(updated).toBeDefined();
      expect((updated as any).command).toBe('npm');
      expect((updated as any).args).toEqual(['start']);
    });

    it('should preserve disabled status during update', () => {
      manager.addServer('update-disabled', {
        command: 'node',
        args: [],
        disabled: true
      });

      manager.updateServer('update-disabled', { command: 'npm' });
      const updated = manager.getServer('update-disabled');

      expect((updated as any).disabled).toBe(true);
      expect((updated as any).command).toBe('npm');
    });

    it('should throw error when updating non-existing server', () => {
      expect(() => manager.updateServer('non-existing', {})).toThrow('not found');
    });
  });

  describe('persistence', () => {
    it('should persist configuration to file in standard MCP format', () => {
      manager.addServer('persistent', {
        command: 'node',
        args: []
      });

      const configFile = path.join(testConfigDir, 'mcp.json');
      expect(fs.existsSync(configFile)).toBe(true);

      const content = JSON.parse(fs.readFileSync(configFile, 'utf-8'));
      // Standard MCP format uses mcpServers object, not servers array
      expect(content.mcpServers).toBeDefined();
      expect(content.mcpServers.persistent).toBeDefined();
      expect(content.mcpServers.persistent.command).toBe('node');
    });

    it('should load existing configuration on instantiation', () => {
      const configFile = path.join(testConfigDir, 'mcp.json');
      // Standard MCP format
      const existingConfig = {
        mcpServers: {
          existing: {
            command: 'node',
            args: []
          }
        }
      };

      fs.writeFileSync(configFile, JSON.stringify(existingConfig, null, 2));

      const newManager = new ConfigManager(testConfigDir);
      const servers = newManager.listServers();

      expect(servers).toHaveLength(1);
      expect(servers[0].name).toBe('existing');
    });

    it('should reject old format (servers array)', () => {
      const configFile = path.join(testConfigDir, 'mcp.json');
      // Old format (should be rejected)
      const oldConfig = {
        servers: [
          {
            name: 'old-server',
            type: 'stdio',
            command: 'node',
            args: []
          }
        ]
      };

      fs.writeFileSync(configFile, JSON.stringify(oldConfig, null, 2));

      const newManager = new ConfigManager(testConfigDir);
      const servers = newManager.listServers();

      // Old format should be rejected, returning empty list
      expect(servers).toHaveLength(0);
    });
  });
});
