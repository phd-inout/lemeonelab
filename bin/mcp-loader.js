#!/usr/bin/env node

/**
 * LemeoneLab MCP Remote Loader
 * Optimized for clean JSON-RPC communication by suppressing warnings.
 */

const { spawn } = require('child_process');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const serverPath = path.join(rootDir, 'mcp-server', 'index.js');

// Use npx to run tsx, ensuring we suppress node warnings that break JSON-RPC
const child = spawn('npx', [
  '-y', 'tsx', 
  serverPath,
  ...process.argv.slice(2)
], {
  cwd: rootDir,
  stdio: 'inherit',
  env: { 
    ...process.env, 
    NODE_OPTIONS: '--no-warnings',
    NODE_NO_WARNINGS: '1'
  }
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
