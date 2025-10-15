# Swarm MCP Server

**Disclaimer:** This implementation is a proof-of-concept only, should not be used in production.

A Model Context Protocol (MCP) server implementation that uses Ethereum Swarm's Bee API for storing and retrieving data.

## Overview

This server implements the Model Context Protocol (MCP), a standard protocol for connecting AI systems with external tools and data sources. The Swarm MCP server provides tools to upload and download text data, storing this data on the Swarm decentralized storage network using the Bee API.

## Features

- Upload text data to Swarm through the MCP protocol
- Download text data from Swarm through the MCP protocol
- Standard MCP server interface using stdio transport
- Configurable Bee API endpoints and postage batch IDs

## MCP Tools

The server provides the following MCP tools:

### `upload_data`

Uploads text data to the Swarm network.

**Parameters:**

- `data`: String data to upload
- `redundancyLevel`: (Optional) Redundancy level for fault tolerance (0-4, default: 0)
  - 0: none
  - 1: medium
  - 2: strong
  - 3: insane
  - 4: paranoid
- `memoryTopic`: (Optional) If provided, uploads the data to a Swarm Feed with this topic (requires `BEE_FEED_PK` in config)

**Returns:**

- `reference`: Swarm reference hash for the uploaded data or feed
- `url`: URL to access the data via Bee API
- `message`: Status message
- `topicString`, `topic`, `feedUrl`: (If using `memoryTopic`) Feed details

### `download_data`

Retrieves text data from the Swarm network. Should be used when the data is known to be text format.

**Parameters:**

- `reference`: Swarm reference hash or feed topic
- `isMemoryTopic`: (Optional, boolean) Set true to retrieve from a Swarm feed
- `owner`: (Optional) Ethereum address of the feed owner

**Returns:**

- Retrieved text data

### `upload_file`

Uploads a file to the Swarm network.

**Parameters:**

- `data`: Base64 encoded file content or file path
- `isPath`: (Optional) Whether the data parameter is a file path (default: false)
- `redundancyLevel`: (Optional) Redundancy level for fault tolerance (0-4, default: 0)

**Returns:**

- `reference`: Swarm reference hash for the uploaded file
- `url`: URL to access the file via Bee API
- `message`: Status message

### `upload_folder`

Uploads a folder to the Swarm network.

**Parameters:**

- `folderPath`: Path to the folder to upload
- `redundancyLevel`: (Optional) Redundancy level for fault tolerance (0-4, default: 0)

**Returns:**

- `reference`: Swarm reference hash for the uploaded folder
- `url`: URL to access the folder via Bee API
- `message`: Status message

### `download_files`

Downloads folder, files from a Swarm reference. This tool should be prioritized over `download_data` if there is no assumption about the data type.

**Parameters:**

- `reference`: Swarm reference hash
- `filePath`: (Optional) File path to save the downloaded content (only available in stdio mode)

**Returns:**

- If `filePath` is not provided: List of files in the manifest
- If `filePath` is provided: Content saved to specified location

## Setup

### Prerequisites

- Node.js 18+ installed
- npm
- A running Bee node or access to a public Bee gateway
- A valid postage batch ID (for production use)

### Installation

1. Clone this repository
2. Install dependencies:

```bash
npm ci
```

### Configuration

The server configuration is located in `src/config.ts`:

You can customize:

- **Bee API endpoint**: Set to any Swarm Bee node or gateway
- **Postage Batch ID**: Required for uploading data to Swarm (the default ID is a placeholder for testing)

Modify these values as needed for your environment.

## Running the Server Locally

You can run the server locally in two different modes: `stdio` or `web`.

### Stdio (Default)

This is the standard mode for direct integration with MCP clients that manage their own subprocesses.

**Development (with hot-reloading):**

```bash
npm run dev
```

**Development (without building):**

```bash
npm run serve
```

**Production:**
First, build the project:

```bash
npm run build
```

Then, run the server:

```bash
npm start
# or
npm run start:stdio
```

### Web Server (HTTP + SSE)

This runs the server as a web service on port 3000, with endpoints for both HTTP and SSE.

**Development (without building):**

```bash
npm run serve:web
```

**Production:**
First, build the project:

```bash
npm run build
```

Then, run the server:

```bash
npm run start:web
```

## Docker

This project includes a Dockerfile to run the Swarm MCP server as a containerized service, with both HTTP and SSE transports.

- `Dockerfile`: Builds a single image for the server, which runs on port 3000.

### Building the Docker Image

To build the Docker image, run the following command from the project root:

```bash
docker build -t swarm-mcp .
```

### Running the Docker Container

To run the server, use the `docker run` command. The container exposes port `3000` for both HTTP and SSE.

```bash
docker run --name swarm-mcp -p 3000:3000 swarm-mcp
```

#### Configuration with Environment Variables

To configure the server, pass environment variables to the container using the `-e` flag. This is necessary to connect to your own Bee node or use features like Swarm Feeds.

```bash
docker run -p 3000:3000 \
  -e BEE_API_URL="http://localhost:1633" \
  -e BEE_BATCH_ID="your_batch_id_here" \
  -e BEE_FEED_PK="your_private_key_here" \
  swarm-mcp
```

### Testing with cURL

You can test if the servers are running correctly by sending a `tools/list` request using `curl`.

#### HTTP Server

This command asks the server to list all available tools and expects a single JSON response.

```bash
curl -X POST http://localhost:3000/mcp \
-H "Content-Type: application/json" \
-H "Accept: application/json, text/event-stream" \
-d '{
  "jsonrpc": "2.0",
  "method": "tools/list",
  "id": 1
}'
```

_Note:_ `text/event-stream` in the accept header is required for the HTTP server, even to return a JSON response.

A successful response will be a JSON object containing a list of the server's tools.

#### SSE Server

Interacting with the SSE server is a two-step process. First, you establish a connection to get a `sessionId`, and then you use that ID to send messages.

**Step 1: Open the SSE connection**

Run the following command in a terminal. It will connect to the server and wait for events. The server will send back a `sessionId` which you will need for the next step.

```bash
# In Terminal 1
curl -N -H "Accept:text/event-stream" http://localhost:3000/sse
```

The output will contain the session ID, for example:
`id: "<your-session-id>"`

**Step 2: Send a message**

In a second terminal, use the `sessionId` from Step 1 to send a request. Replace `<your-session-id>` with the actual ID.

```bash
# In Terminal 2
curl -X POST -H "Content-Type: application/json" \
-d '{"jsonrpc":"2.0","method":"tools/list","params":{},"id":2}' \
"http://localhost:3000/message?sessionId=<your-session-id>"
```

The response will appear in Terminal 1.

## Using with MCP Clients

The server supports two connection methods:

### 1. Web Connection (Docker)

When running the server in Docker, it operates as a web service with both HTTP and SSE endpoints. To connect your MCP client, you must use one that supports connecting to a remote server via URL.

- **HTTP Server URL**: `http://localhost:3000/mcp`
- **SSE Server URL**: `http://localhost:3000/sse`

In your client's settings, add a new remote/custom connector and provide the appropriate URL.

_**Note on supported features**_: Functionalities that require direct access to the local file system are not available in web mode. This includes using local paths for uploads (e.g., `upload_folder` or `upload_file` with `isPath: true`) and downloading directly to a file (e.g., `download_folder` with `filePath`). These features are only supported when running the server in `stdio` mode.

### 2. Stdio Connection (Local)

For local development or with clients that manage their own server subprocesses, you can run the server directly in `stdio` mode.

For detailed instructions on how to configure your MCP client for stdio, please refer to the [Swarm MCP Client Setup guide](./docs/mcp-client-setup.md).

To run the server in this mode, see the commands under the **Stdio (Default)** section above.
