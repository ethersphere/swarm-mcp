#!/usr/bin/env node

import swarmMCPServer from './mcp-service';

// Run the Swarm MCP Server
console.error('Starting Swarm MCP Server...');
swarmMCPServer.run().catch((error) => {
  console.error('Failed to start Swarm MCP Server:', error);
  process.exit(1);
});

