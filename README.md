# Swarm MCP Server

**Disclaimer:** This implementation is a proof-of-concept only, should not be used in production.

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

## Configuration Options

| Option                              | Type          | Required      | Description                                                                                                                                               |
| ----------------------------------- | --------------| --------------| --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BEE_API_URL`                       | string        | **optional** (unless using your own node) | The URL of the Bee API endpoint. If omitted, the default Swarm Gateway will be used: `https://api.gateway.ethswarm.org`. Example: `http://localhost:1633`.|
| `BEE_FEED_PK`                       | string        | **optional** (cannot update feed without it)  | The private key of the Swarm Feed to use. If not provided, Swarm Feed functionality will be disabled.                                                     |
| `AUTO_ASSIGN_STAMP`                 | boolean       | **optional**  | Whether to automatically assign a postage stamp if none is provided. Default value is: true. Set to false to disable automatic stamp assignment.          |
| `DEFERRED_UPLOAD_SIZE_THRESHOLD_MB` | number        | **optional**  | Size threshold in megabytes for deferred uploads. Files larger than this size will be uploaded asynchronously. Default value is: 5 (MB).                  |



## MCP Tools

The server provides the following MCP tools:


### `create_postage_stamp`

Buy postage stamp batch based on size in megabytes and duration.

**Parameters:**

- `size`: The storage size in MB (Megabytes). These other size units convert like this to MB: 1 byte = 0.000001 MB, 1  KB = 0.001 MB, 1GB= 1000MB.
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
- `size`: (Optional) The storage size in MB (Megabytes). These other size units convert like this to MB: 1 byte = 0.000001 MB, 1  KB = 0.001 MB, 1GB= 1000MB.
- `duration`: (Optional) Duration for which the data should be stored. Time to live of the postage stamp batch, e.g. 1d - 1 day, 1w - 1 week, 1month - 1 month.

**Sample prompt:**

```bash
Extend 3b3881ac37f936a4023a4562c69f1f138df8c1c24994f7b047514fbcbe9388fa to 5 days.
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
- `memoryTopic`: If provided, uploads the lastes data to a feed with this topic. It is the label of the memory that can be used later to retrieve the data instead of its content hash. If not a hex string, it will be hashed to create a feed topic.
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

Upload a file to Swarm.

**Parameters:**

- `data`: base64 encoded file content or file path.
- `isPath`: Wether the data parameter is a path.
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

Download folder, files from a Swarm reference and save to file path or return file list of the reference.


**Parameters:**

- `reference`: Swarm reference hash.
- `filePath`: (Optional) Optional file path to save the downloaded content. If not provided list of files in the manifest will be returned.

**Sample prompt:**

```bash
Download from Swarm the file with reference ba35af06601ddf5ac3d71ee33da0db7537215a914fd6a5414b5597bb3d618bdb to folder downloads.
```


### `query_upload_progress`

Query upload progress for a specific upload session identified with the returned Tag ID.

**Parameters:**

- `tagId`: Tag ID returned by swarm-upload-file and swarm-upload-folder tools to track upload progress.

**Sample prompt:**

```bash
Query Swarm for upload tag with id: 1.
```

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
