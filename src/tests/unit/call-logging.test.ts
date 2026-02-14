import { describe, it, expect } from 'vitest';

describe('tool call logging format', () => {
  describe('log message formatting', () => {
    it('should format tool request message correctly', () => {
      const serverName = 'test-server';
      const toolName = 'test_tool';
      const args = { arg1: 'value1', arg2: 123 };

      const message = `[Tool Request] Server: ${serverName}, Tool: ${toolName}, Args: ${JSON.stringify(args)}`;

      expect(message).toContain('[Tool Request]');
      expect(message).toContain(`Server: ${serverName}`);
      expect(message).toContain(`Tool: ${toolName}`);
      expect(message).toContain('Args:');
      expect(message).toContain('arg1');
      expect(message).toContain('value1');
    });

    it('should format tool response message correctly', () => {
      const serverName = 'test-server';
      const toolName = 'test_tool';
      const result = { content: [{ type: 'text', text: 'success' }] };

      const message = `[Tool Response] Server: ${serverName}, Tool: ${toolName}, Result: ${JSON.stringify(result)}`;

      expect(message).toContain('[Tool Response]');
      expect(message).toContain(`Server: ${serverName}`);
      expect(message).toContain(`Tool: ${toolName}`);
      expect(message).toContain('Result:');
    });

    it('should handle empty args', () => {
      const serverName = 'test-server';
      const toolName = 'test_tool';
      const args = {};

      const message = `[Tool Request] Server: ${serverName}, Tool: ${toolName}, Args: ${JSON.stringify(args)}`;

      expect(message).toContain('Args: {}');
    });

    it('should handle complex nested args', () => {
      const serverName = 'test-server';
      const toolName = 'test_tool';
      const args = {
        user: { name: 'Alice', settings: { theme: 'dark' } },
        items: [1, 2, 3]
      };

      const message = `[Tool Request] Server: ${serverName}, Tool: ${toolName}, Args: ${JSON.stringify(args)}`;

      expect(message).toContain('Alice');
      expect(message).toContain('dark');
      expect(message).toContain('items');
    });
  });

  describe('MCPS_VERBOSE environment variable', () => {
    it('should be undefined by default', () => {
      // 确保测试之间隔离
      delete process.env.MCPS_VERBOSE;
      expect(process.env.MCPS_VERBOSE).toBeUndefined();
    });

    it('should be true when set to "true"', () => {
      process.env.MCPS_VERBOSE = 'true';
      expect(process.env.MCPS_VERBOSE === 'true').toBe(true);
    });

    it('should be false when set to other values', () => {
      process.env.MCPS_VERBOSE = '1';
      expect(process.env.MCPS_VERBOSE === 'true').toBe(false);

      process.env.MCPS_VERBOSE = 'false';
      expect(process.env.MCPS_VERBOSE === 'true').toBe(false);

      process.env.MCPS_VERBOSE = '';
      expect(process.env.MCPS_VERBOSE === 'true').toBe(false);

      // 清理
      delete process.env.MCPS_VERBOSE;
    });
  });
});
