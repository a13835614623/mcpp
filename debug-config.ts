import { z } from 'zod';
import { ServerConfigSchema } from './src/types/config.ts';

// Mock data simulating what we read from mcporter.json and transformed
const mockConfig = {
  "chrome-devtools": {
    "command": "npx",
    "args": [
      "-y",
      "chrome-devtools-mcp",
      "--executablePath",
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    ],
    "lifecycle": "keep-alive"
  },
  "阿里云DMS": {
    "command": "uvx",
    "args": [
      "alibabacloud-dms-mcp-server@latest"
    ],
    "env": {
      "ALIBABA_CLOUD_ACCESS_KEY_ID": "xxx",
      "ALIBABA_CLOUD_ACCESS_KEY_SECRET": "xxx"
    },
    "lifecycle": "keep-alive"
  }
};

// Simulate the transformation logic in src/core/config.ts
const servers = Object.entries(mockConfig).map(([name, config]: [string, any]) => ({
    name,
    type: config.type || (config.command ? 'stdio' : undefined),
    ...config
}));

console.log('--- Testing Validation ---');

for (const server of servers) {
    console.log(`\nChecking server: ${server.name}`);
    const result = ServerConfigSchema.safeParse(server);
    if (result.success) {
        console.log('✅ Valid');
    } else {
        console.log('❌ Invalid');
        console.log(JSON.stringify(result.error.format(), null, 2));
    }
}
