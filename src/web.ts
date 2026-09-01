#!/usr/bin/env node

import express, { Request, Response } from "express";
import cors from "cors";
import { randomUUID } from "crypto";
import { SwarmMCPServer } from "./mcp-service";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const host = process.env.HOST || "0.0.0.0";

const app = express();

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

interface Session {
  swarmMCPServer: SwarmMCPServer;
  transport: StreamableHTTPServerTransport;
}

// One MCP server per session: task state lives in the server instance
// (in-memory task store), so tasks/get and tasks/result only work if the same
// instance handles every request of a session.
const sessions: Map<string, Session> = new Map<string, Session>();

const sendJsonRpcError = (
  res: Response,
  status: number,
  code: number,
  message: string,
  id: unknown = null
) => {
  res.status(status).json({
    jsonrpc: "2.0",
    error: { code, message },
    id,
  });
};

async function createSession(): Promise<Session> {
  const swarmMCPServer = new SwarmMCPServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
    onsessioninitialized: (sessionId: string) => {
      sessions.set(sessionId, { swarmMCPServer, transport });
    },
  });

  // Fires on client DELETE, on transport close and on connection teardown.
  transport.onclose = () => {
    const { sessionId } = transport;
    if (sessionId) {
      sessions.delete(sessionId);
    }
    void swarmMCPServer.close();
  };

  await swarmMCPServer.server.connect(transport);

  return { swarmMCPServer, transport };
}

async function main() {
  // Handle all MCP requests on the /mcp endpoint
  app.all("/mcp", async (req: Request, res: Response) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;

    try {
      let transport: StreamableHTTPServerTransport;

      if (sessionId) {
        const session = sessions.get(sessionId);
        if (!session) {
          sendJsonRpcError(
            res,
            404,
            -32001,
            "Session not found",
            req.body?.id ?? null
          );
          return;
        }
        transport = session.transport;
      } else if (req.method === "POST" && isInitializeRequest(req.body)) {
        // A new session starts with an initialize request; the transport
        // assigns the session id and registers itself in `sessions`.
        ({ transport } = await createSession());
      } else {
        sendJsonRpcError(
          res,
          400,
          -32000,
          "Bad Request: Mcp-Session-Id header is required",
          req.body?.id ?? null
        );
        return;
      }

      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error("Error handling MCP request:", error);
      if (!res.headersSent) {
        sendJsonRpcError(
          res,
          500,
          -32603,
          "Internal server error",
          req.body?.id ?? null
        );
      }
    }
  });

  // Start the server
  const httpServer = app.listen(port, host, () => {
    console.error(`Swarm MCP server listening on http://${host}:${port}/mcp`);
  });

  // Without this, a failure to bind (e.g. the port is already taken) exits
  // silently with code 0 and looks like the server started.
  httpServer.on("error", (error) => {
    console.error("Failed to start Swarm MCP Server:", error);
    process.exit(1);
  });

  process.on("SIGINT", async () => {
    await Promise.allSettled(
      Array.from(sessions.values()).map((session) => session.transport.close())
    );
    process.exit(0);
  });
}

main().catch((error) => {
  console.error("Failed to start Swarm MCP Server:", error);
  process.exit(1);
});
