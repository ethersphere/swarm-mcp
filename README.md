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

**Returns:**
- `reference`: Swarm reference hash for the uploaded data
- `message`: Status message

### `download_text`

Retrieves text data from the Swarm network.

**Parameters:**
- `reference`: Swarm reference hash

**Returns:**
- Retrieved text data

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
3. Use the provided `upload_text` and `download_text` tools
