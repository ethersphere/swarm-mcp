#!/usr/bin/env node

import { SwarmMCPServer } from "./mcp-service";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

async function main() {
  const swarmMCPServer = new SwarmMCPServer();
  const transport = new StdioServerTransport();
  await swarmMCPServer.server.connect(transport);
}

main().catch((error) => {
  console.error("Failed to start Swarm MCP Server:", error);
  process.exit(1);
});

