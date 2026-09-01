# Swarm MCP Server

A Model Context Protocol (MCP) server implementation that uses Ethereum Swarm's Bee API for storing and retrieving data.

## Overview

This server implements the Model Context Protocol (MCP), a standard protocol for connecting AI systems with external tools and data sources. The Swarm MCP server provides tools to upload and download text data, storing this data on the Swarm decentralized storage network using the Bee API.

## Features

- Upload text data to Swarm.
- Download text data from Swarm.
- Upload files and folders to Swarm.
- Download files and folders from Swarm.
- Update data on a Swarm feed.
- Read latest data from a Swarm feed.
- Create postage stamp batches for storage.
- Get a postage stamp batch.
- List postage stamp batches.
- Extend storage and duration of a postage stamp batch.
- Track the progress of deferred (background) uploads.
- Run long-running operations as MCP tasks.
- Expose every tool as an MCP prompt.

## Configuration Options

| Option                              | Type    | Required                                     | Description                                                                                                                                                |
| ----------------------------------- | ------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BEE_API_URL`                       | string  | **optional** (unless using your own node)    | The URL of the Bee API endpoint. If omitted, the default Swarm Gateway will be used: `https://api.gateway.ethswarm.org`. Example: `http://localhost:1633`. |
| `BEE_FEED_PK`                       | string  | **optional** (cannot update feed without it) | The private key of the Swarm Feed to use. If not provided, Swarm Feed functionality will be disabled.                                                      |
| `AUTO_ASSIGN_STAMP`                 | boolean | **optional**                                 | Whether to automatically assign a postage stamp if none is provided. Default value is: true. Set to false to disable automatic stamp assignment.           |
| `DEFERRED_UPLOAD_SIZE_THRESHOLD_MB` | number  | **optional**                                 | Size threshold in megabytes for deferred uploads. Files larger than this size will be uploaded asynchronously. Default value is: 5 (MB).                   |
| `TASK_TTL_MS`                       | number  | **optional**                                 | Time to live of a task in milliseconds. Default value is: 1200000 (20 minutes). If the task TTL specified by the MCP client is larger than this value, that one will be used.                                                                          |
| `PORT`                              | number  | **optional** (web mode only)                 | Port the HTTP server listens on. Default value is: 3000.                                                                                                                                                                                             |
| `HOST`                              | string  | **optional** (web mode only)                 | Host interface the HTTP server binds to. Default value is: `0.0.0.0`.                                                                                                                                                                                |

## Bee Node vs. Swarm Gateway

The server detects at runtime whether `BEE_API_URL` points at the public Swarm Gateway or at a full Bee node, and adapts
what it exposes:

- **Own Bee node** (e.g. `http://localhost:1633`): all tools are available, and tools that support it can be executed as
  MCP tasks.
- **Swarm Gateway** (the default when `BEE_API_URL` is omitted): the postage-stamp tools (`create_postage_stamp`,
  `get_postage_stamp`, `list_postage_stamps`, `extend_postage_stamp`) and `query_upload_progress` are omitted from
  `tools/list`, because the gateway does not expose those endpoints. Task execution is also disabled, so every call runs
  synchronously.

## MCP Tools

The server provides the following MCP tools:

### `create_postage_stamp`

Buy postage stamp batch based on size in megabytes and duration.

**Parameters:**

- `size`: Storage capacity, e.g. 1GB, 1MB, 1KB.
- `duration`: Duration for which the data should be stored. Time to live of the postage stamp batch, e.g. 1d - 1 day, 1w - 1 week, 1month - 1 month.
- `label`: (Optional) Sets label for the postage stamp batch.

**Sample prompt:**

```bash
Create new stamp with 4 days, 10 megabytes.
```

### `get_postage_stamp`

Get a specific postage stamp batch based on batch id.

**Parameters:**

- `postageBatchId`: The id of the postage stamp batch which is requested.

**Sample prompt:**

```bash
Give me the details for batch 3b3881ac37f936a4023a4562c69f1f138df8c1c24994f7b047514fbcbe9388fa.
```

### `list_postage_stamps`

List the available postage stamp batches.

**Parameters:**

- `leastUsed`: (Optional) A boolean value that tells if postage stamp batches are sorted so least used comes first.
- `limit`: (Optional) Limit is the maximum number of returned postage stamp batches.
- `minUsage`: (Optional) Only list postage stamp batches with at least this usage percentage.
- `maxUsage`: (Optional) Only list postage stamp batches with at most this usage percentage.

**Sample prompt:**

```bash
List my stamps.
```

### `extend_postage_stamp`

Increase the duration (relative to current duration) or size (in megabytes) of a postage stamp batch.

**Parameters:**

- `postageBatchId`: The id of the postage stamp batch for which extend is performed.
- `size`: (Optional) Storage capacity, e.g. 1GB, 1MB, 1KB.
- `duration`: (Optional) Duration for which the data should be stored. Time to live of the postage stamp batch, e.g. 1d - 1 day, 1w - 1 week, 1month - 1 month.

**Sample prompt:**

```bash
Extend 3b3881ac37f936a4023a4562c69f1f138df8c1c24994f7b047514fbcbe9388fa by 5 days.
```

### `upload_data`

Upload text data to Swarm.

**Parameters:**

- `data`: Arbitrary string to upload.
- `redundancyLevel`: (Optional) Redundancy level for fault tolerance: 0 - none, 1 - medium, 2 - strong, 3 - insane, 4 - paranoid (higher values provide better fault tolerance but increase storage overhead). Optional, value is 0 if not requested.
- `postageBatchId`: (Optional) The postage stamp batch ID which will be used to perform the upload, if it is provided.

**Sample prompt:**

```bash
Upload data to Swarm: Hello World!.
```

### `download_data`

Downloads immutable data from a Swarm content address hash.

**Parameters:**

- `reference`: Swarm reference hash.

**Sample prompt:**

```bash
Download data from Swarm: 76d133e2798d2b15db55b6c3de01303acd86e43998eab372e25c5a2115bf3f0b.
```

### `update_feed`

Update the feed of a given topic with new data.

**Parameters:**

- `data`: Arbitrary string to upload.
- `memoryTopic`: If provided, uploads the latest data to a feed with this topic. It is the label of the memory that can be used later to retrieve the data instead of its content hash. If not a hex string, it will be hashed to create a feed topic.
- `postageBatchId`: (Optional) The postage stamp batch ID which will be used to perform the upload, if it is provided.

**Sample prompt:**

```bash
Update the Swarm feed of Topic1 with: Message1 using postage batch id 3b3881ac37f936a4023a4562c69f1f138df8c1c24994f7b047514fbcbe9388fa.
```

### `read_feed`

Retrieve the latest data from the feed of a given topic.

**Parameters:**

- `memoryTopic`: Feed topic.
- `owner`: (Optional) When accessing external memory or feed, ethereum address of the owner must be set..

**Sample prompt:**

```bash
Read the Swarm feed of Topic1.
```

### `upload_file`

Upload a file to Swarm. Small files upload synchronously and return the reference. Large files (over the deferred-upload threshold) upload in the background: the response immediately includes the final reference (computed locally) and a tag ID for `query_upload_progress`; the content becomes retrievable at the reference once the upload completes. When `redundancyLevel` > 0, only the tag ID is returned immediately.

**Parameters:**

- `data`: File content or file path.
- `redundancyLevel`: (Optional) Redundancy level for fault tolerance (higher values provide better fault tolerance but increase storage overhead). 0 - none, 1 - medium, 2 - strong, 3 - insane, 4 - paranoid.
- `postageBatchId`: (Optional) The postage stamp batch ID which will be used to perform the upload, if it is provided.

**Sample prompt:**

```bash
Upload to Swarm the file: uploads/file.txt.
```

### `upload_folder`

Upload a folder to Swarm.

**Parameters:**

- `folderPath`: Path to the folder to upload.
- `redundancyLevel`: (Optional) Redundancy level for fault tolerance (higher values provide better fault tolerance but increase storage overhead). 0 - none, 1 - medium, 2 - strong, 3 - insane, 4 - paranoid.
- `postageBatchId`: (Optional) The postage stamp batch ID which will be used to perform the upload, if it is provided.

**Sample prompt:**

```bash
Upload to Swarm folder: /home/conversational-agent-client/uploads.
```

### `download_files`

Download a file or folder from a Swarm reference and save it to disk. Handles both single files and folder manifests. The
reference must be a manifest — for raw text data uploaded with `upload_data`, use `download_data` instead.

**Parameters:**

- `reference`: Swarm reference hash.
- `filePath`: (Optional) Destination **folder** (not a filename) to save the downloaded content into. Files from the manifest are written inside this folder under their original names. Absolute paths are recommended; relative paths resolve against the server's working directory. If omitted, files are saved into the server's current working directory. Only available in `stdio` mode.

**Sample prompt:**

```bash
Download from Swarm the file with reference ba35af06601ddf5ac3d71ee33da0db7537215a914fd6a5414b5597bb3d618bdb to folder downloads.
```

### `query_upload_progress`

Query upload progress for a specific upload session identified with the returned Tag ID. Also returns the final Swarm
`reference` of the upload, which is how you obtain the reference of a deferred `upload_folder` (a folder's reference
cannot be computed up front) once `processedPercentage` reaches 100.

**Parameters:**

- `tagId`: Tag ID returned by the `upload_file` and `upload_folder` tools to track upload progress.

**Sample prompt:**

```bash
Query Swarm for upload tag with id: 1.
```

## MCP Tasks (long-running operations)

The server declares the `tasks` capability, so a client can ask for a slow operation to be executed as a task and poll
for its result instead of holding the tool call open.

Task execution is opt-in per call: the client includes task parameters (`ttl`, `pollInterval`) in the `tools/call`
request. If it does not, the tool runs synchronously as usual.

The following tools accept task execution (`taskSupport: "optional"`):

- `upload_file`
- `upload_folder`
- `download_files`
- `create_postage_stamp`
- `extend_postage_stamp`

All other tools are declared `taskSupport: "forbidden"` and always run synchronously. Task execution also requires a real
Bee node — see [Bee Node vs. Swarm Gateway](#bee-node-vs-swarm-gateway).

Supported task requests: `tasks/get`, `tasks/result`, and `tasks/list` (paginated with a cursor, 50 tasks per page).

Task lifetime is governed by `TASK_TTL_MS` (default 20 minutes); the effective TTL is the larger of that value and the
one the client requested. The default poll interval is 5 seconds. Tasks are held in an in-memory store, so they do not
survive a server restart.

## MCP Prompts

The server also declares the `prompts` capability and exposes one prompt per tool, named `<tool_name>_prompt` (e.g.
`upload_data_prompt`, `download_files_prompt`). Each prompt takes the same arguments as the corresponding tool and
returns a natural-language instruction — useful for clients that surface prompts as slash commands or templates. The
prompt list is generated from the tool schemas, so it always stays in sync with the tools above.

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

You need to create a `.env` file with the content from `.env.example`. Update the environment variables with the desired values.

### Tests, Linting and Formatting

```bash
npm test          # run the Jest test suite
npm run lint      # ESLint
npm run format    # Prettier, writes in place
```

### Publishing

This server is also published to the Model Context Protocol registry as `io.github.Solar-Punk-Ltd/swarm-mcp`, with the
npm package `@solarpunkltd/swarm-mcp` (stdio transport). The registry metadata lives in `server.json`. For the release
and publishing process, see the [MCP registry publishing guide](./docs/mcp-registry-publish.md).

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

### Web Server (HTTP)

This runs the server as a web service on port 3000, with endpoints for HTTP.

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

This project includes a Dockerfile to run the Swarm MCP server as a containerized service with HTTP transport.

- `Dockerfile`: Builds a single image for the server, which runs on port 3000.

### Building the Docker Image

To build the Docker image, run the following command from the project root:

```bash
docker build -t swarm-mcp .
```

### Running the Docker Container

To run the server, use the `docker run` command. The container exposes port `3000` for HTTP.

```bash
docker run --name swarm-mcp -p 3000:3000 swarm-mcp
```

#### Configuration with Environment Variables

To configure the server, pass environment variables to the container using the `-e` flag. This is necessary to connect to your own Bee node or use features like Swarm Feeds.

```bash
docker run -p 3000:3000 \
  -e BEE_API_URL="http://localhost:1633" \
  -e BEE_FEED_PK="your_private_key_here" \
  -e AUTO_ASSIGN_STAMP="true" \
  -e DEFERRED_UPLOAD_SIZE_THRESHOLD_MB="5" \
  swarm-mcp
```

### Testing with cURL

The HTTP transport is session-based, so `tools/list` cannot be sent on its own: every session starts with an
`initialize` request, and the server returns the session id in the `Mcp-Session-Id` response header. Subsequent requests
must echo that id back.

First, initialize and read the session id from the response headers (`-i`):

```bash
curl -i -X POST http://localhost:3000/mcp \
-H "Content-Type: application/json" \
-H "Accept: application/json, text/event-stream" \
-d '{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2025-06-18",
    "capabilities": {},
    "clientInfo": { "name": "curl", "version": "1.0.0" }
  }
}'
```

Then list the tools, passing the id from the `Mcp-Session-Id` header above:

```bash
curl -X POST http://localhost:3000/mcp \
-H "Content-Type: application/json" \
-H "Accept: application/json, text/event-stream" \
-H "Mcp-Session-Id: <session-id-from-the-initialize-response>" \
-d '{
  "jsonrpc": "2.0",
  "method": "tools/list",
  "id": 2
}'
```

A successful response contains the list of the server's tools. Send `DELETE /mcp` with the same header to end the
session.

_Note:_ `text/event-stream` in the accept header is required, and responses arrive as a server-sent event frame
(`event: message` followed by a `data:` line holding the JSON-RPC payload) rather than as a bare JSON body. Requests with
no session id are rejected with `400`, and requests naming an unknown or ended session with `404`.

## Using with MCP Clients

The server supports two connection methods:

### 1. Web Connection (Docker)

When running the server in Docker, it operates as a web service with HTTP endpoint. To connect your MCP client, you must use: `http://localhost:3000/mcp`.

In your client's settings, add a new remote/custom connector and provide the appropriate URL.

_**Note on supported features**_: Functionalities that require direct access to the local file system are not available in web mode, and are only supported when running the server in `stdio` mode:

- `upload_folder` is rejected outright — it always reads from the local file system.
- `upload_file` is rejected when the `data` value resolves to an existing local file. The server decides this itself by
  checking the path; there is no flag to set. Passing raw file content as `data` works in both modes.
- `download_files` is rejected when `filePath` is supplied. Without `filePath` the call succeeds, but the files are
  written into the working directory of the server process, not the client machine.

### 2. Stdio Connection (Local)

For local development or with clients that manage their own server subprocesses, you can run the server directly in `stdio` mode.

For detailed instructions on how to configure your MCP client for stdio, please refer to the [Swarm MCP Client Setup guide](./docs/mcp-client-setup.md).

To run the server in this mode, see the commands under the **Stdio (Default)** section above.
