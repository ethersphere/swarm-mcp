#!/usr/bin/env node

import express, { Request, Response } from "express";
import cors from "cors";
import { SwarmMCPServer } from "./mcp-service";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const host = process.env.HOST || "0.0.0.0";

const app = express();

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// For storing SSE transports
const transports: Map<string, SSEServerTransport> = new Map<
  string,
  SSEServerTransport
>();

async function main() {
  // Setup for stateless HTTP transport
  const httpSwarmMCPServer = new SwarmMCPServer();
  const httpTransport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // Enforce stateless behavior
  });
  await httpSwarmMCPServer.server.connect(httpTransport);

  // Handle all MCP requests on the /mcp endpoint
  app.all("/mcp", async (req: Request, res: Response) => {
    try {
      await httpTransport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error("Error handling MCP request:", error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: { code: -32603, message: "Internal server error" },
          id: req.body?.id,
        });
      }
    }
  });

  // Setup for stateful SSE transport
  app.get("/sse", async (req, res) => {
    if (req.query.sessionId) {
      res
        .status(400)
        .send(
          "Reconnecting with a session ID is not supported on this endpoint."
        );
      return;
    }

    const { server } = new SwarmMCPServer();
    // Create and store transport for new session
    const transport = new SSEServerTransport("/message", res);
    transports.set(transport.sessionId, transport);

    // Connect server to transport
    await server.connect(transport);

    // Handle close of connection
    res.on("close", () => {
      transports.delete(transport.sessionId);
      server.close();
    });
  });

  app.post("/message", async (req, res) => {
    const sessionId = req.query.sessionId as string;
    if (!sessionId) {
      res.status(400).send("Session ID is required");
      return;
    }

    const transport = transports.get(sessionId);
    if (transport) {
      await transport.handlePostMessage(req, res, req.body);
    } else {
      console.error(`No transport found for sessionId ${sessionId}`);
      res.status(403).send("Session not found");
    }
  });

  // Start the server
  app.listen(port, host, () => {});
}

main().catch((error) => {
  console.error("Failed to start Swarm MCP Server:", error);
  process.exit(1);
});

