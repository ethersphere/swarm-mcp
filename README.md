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

### `upload_text`

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

### `download_text`

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

### `download_folder`

Downloads folder, files, or binary data from a Swarm reference. This tool should be prioritized over `download_text` if there is no assumption about the data type.

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

## Running the Server

### Development Mode

Run the server with hot reloading for development:

```bash
npm run dev
```

### Quick Start (without building)

Run the server directly with ts-node:

```bash
npm run serve
```

### Production Build

Build and run optimized production version:

```bash
npm run build
npm start
```

## Using with MCP Clients

The Swarm MCP server communicates via standard input/output (stdio) following the MCP protocol. To use it with MCP clients:

1. Start the server
2. Connect your MCP-compatible client to the server
3. Use the provided MCP tools (`upload_text`, `download_text`, `upload_file`, `upload_folder`, `download_folder`)
