# Swarm MCP Client Setup

This document provides comprehensive guidance on setting up and configuring MCP (Model Context Protocol) clients to
interact with the Swarm MCP server. It covers the configuration structure and setup instructions for various MCP client
applications.

## Table of Contents

- [Building the Project](#building-the-project)
- [Understanding the Configuration](#understanding-the-configuration)
    - [Configuration Structure](#configuration-structure)
    - [Configuration Fields](#configuration-fields)
- [Setting up MCP Clients](#setting-up-mcp-clients)
    - [Claude Desktop](#claude-desktop)
    - [Windsurf](#windsurf)
    - [Cursor](#cursor)

## Building the Project

Before you can use the Swarm MCP client, you'll need to build the project to generate the `dist` folder. Follow these
steps:

1. **Prerequisites**:
    - Node.js (v16 or later recommended)
    - npm (comes with Node.js)
    - Git (for cloning the repository)

2. **Clone the repository** (if you haven't already):
   ```bash
   git clone <repository-url>
   cd swarm-mcp
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Build the project**:
   ```bash
   npm run build
   ```
   This will create a `dist` folder in your project root containing the compiled JavaScript files.

5. **Verify the build**:
   The main entry point should be available at:
   ```
   /path/to/your/swarm-mcp/dist/index.js
   ```

_Note_: See the [README](../README.md) for more information.

## Understanding the Configuration

The MCP (Model Context Protocol) server configuration in the MCP Client is defined through a JSON structure that
specifies how the client should connect to and interact with MCP servers. Here's a comprehensive description:

### Configuration Structure

The MCP server configuration is defined in a JSON object with the following structure:

```json
{
  "mcpServers": {
    "ServerName": {
      "command": "executable",
      "args": [
        "arg1",
        "arg2"
      ],
      "env": {
        "ENV_VAR": "value"
      }
    }
  }
}
```

### Configuration Fields

1. **ServerName** (string, required)
    - A user-defined name for the MCP server (e.g., "Swarm")
    - Appears in the UI to identify the server
2. **command** (string, required)
    - The command to execute to start the MCP server
    - Common values: "node", "python", or a direct path to an executable (e.g. "npx" or "uv")
3. **args** (array of strings, optional)
    - Command-line arguments to pass to the command
    - Typically includes the path to the server script
    - Example: ["/path/to/your/server.js"]
4. **env** (object, optional)
    - Environment variables to set when starting the server
    - Useful for configuration that shouldn't be hardcoded
    - Example: {"BEE_API_URL": "url-to-bee-node"}

#### Swarm-specific Environment Variables

1. **BEE_API_URL** (string, optional)
    - The URL of the Bee API endpoint
    - If omitted, the default Swarm Gateway will be used: `https://api.gateway.ethswarm.org`
    - Example: `http://localhost:1633`
2. **BEE_FEED_PK** (string, optional)
    - The private key of the Swarm Feed to use
    - If not provided, Swarm Feed functionality will be disabled
3. **AUTO_ASSIGN_STAMP** (boolean, optional)
    - Whether to automatically assign a postage stamp if none is provided
    - Default: `true`
    - Set to `false` to disable automatic stamp assignment
4. **DEFERRED_UPLOAD_SIZE_THRESHOLD_MB** (number, optional)
    - Size threshold in megabytes for deferred uploads
    - Files larger than this size will be uploaded asynchronously
    - Default: 5 (MB)

## Setting up MCP Clients

### Claude Desktop

Claude Desktop is a desktop application that can be used to interact with Claude AI models.

#### Setup

1. Download and install [Claude Desktop](https://claude.ai/download)
2. Open Claude Desktop
3. Click "Get Started" and then do Sign In (note: a free account is sufficient)
4. Under your profile, access "Settings"
5. Go to the "Developer" tab and see the "Local MCP servers" section
6. Click "Edit Config"
7. A file explorer window will open, locating the `claude_desktop_config.json` file
8. Open `claude_desktop_config.json` for editing
9. Add the following to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "Swarm": {
      "command": "npx",
      "args": [
        "/path/to/your/swarm-mcp/dist/index.js"
      ],
      "env": {
      }
    }
  }
}
```

10. Save the `claude_desktop_config.json` file
11. Restart Claude Desktop

#### Verify MCP is running

1. Open Claude Desktop
2. Under your profile, access "Settings"
3. Go to the "Developer" tab and see the "Local MCP servers" section
4. You should see the "Swarm" MCP server listed there
5. It should be highlighted with "running" status

#### Controlling accessibility of MCP tools

1. Open Claude Desktop
2. Under your profile, access "Settings"
3. Go to the "Connectors" tab and see the "Connectors" section
4. You should see the "Swarm" MCP server listed there (highlighted as "LOCAL DEV" mode)
5. Click "Configure"
6. You can use the toggles to disable/enable individual tools to be available to Claude
7. You can set individual tools to "Always ask permission" (the default) or "Allow unsupervised" when being used

_Note_: You can verify the MCP server version on the configuration panel as highlighted in the header under the "Swarm"
name (e.g. _swarm-mcp-server v0.1.0_)

#### Troubleshooting

You can refer to this Claud Desktop setup guide on
the [Model Context Protocol](https://modelcontextprotocol.io/quickstart/server#testing-your-server-with-claude-for-desktop)
site for more information.

### Windsurf

Windsurf is a code editor that can be used to edit code with real-time AI assistance and collaborative editing.

#### Setup

1. Download and install [Windsurf Editor](https://windsurf.com/download)
2. Open Windsurf
3. Sign in to Windsurf (note: a free account is sufficient)
4. Open Settings > Windsurf Settings
5. Go to the "Cascade" tab
6. Locate the "MCP Servers" section and click on "Manage MCPs"
7. Click "View raw config" on the top
8. Add the following to the config:

```json
{
  "mcpServers": {
    "Swarm": {
      "command": "npx",
      "args": [
        "/path/to/your/swarm-mcp/dist/index.js"
      ],
      "env": {
      }
    }
  }
}
```

9. Save the config
10. Click "Refresh" on the top of "Manage MCPs"
11. You should see the "Swarm" MCP server listed there

_Note_: You can access the "Manage MCP servers" panel from "Cascade" too (see 'Verify MCP is running'
under [Windsurf](#windsurf))

#### Verify MCP is running

1. Open Windsurf
2. Open "Cascade" (using the icon in the window header)
3. Open "Customizations" (using the box icon at the top right)
4. The "Swarm" MCP should be listed there
5. It should be highlighted with a green status if it is operational (and enabled)

_Note_: You can see the list of (enabled) MCP tools if you click on the "Swarm" MCP server name (the number of enabled
tools is also visible)

#### Controlling accessibility of MCP tools

1. Open Windsurf
2. Go to "Manage MCPs"
3. Select the "Swarm" MCP from the list
4. You can use the toggles to disable/enable individual tools to be available to the AI model
5. You can set the whole of the MCP disabled with the toggle opposite to the "Swarm" MCP name (displayed with an "
   Enabled" tag when it is enabled)

_Note_: You can access the list of enabled tools from the "Customizations" menu of "Cascade" too (see 'Verify MCP is
running' under [Windsurf](#windsurf))

## Cursor

[Cursor](https://cursor.com/home) is a code editor that provides AI-powered coding assistance and collaborative
features.

#### Setup

1. Download and install [Cursor](https://cursor.com/downloads)
2. Open Cursor
3. Sign in to Cursor (note: a free account is sufficient)
4. Open Settings > Cursor Settings
5. Go to the "Tools & Integrations" tab
6. In the "MCP Tools" section click on "New MCP Server"
7. Add the following to the `mcp.json` config:

```json
{
  "mcpServers": {
    "Swarm": {
      "command": "npx",
      "args": [
        "/path/to/your/swarm-mcp/dist/index.js"
      ],
      "env": {
      }
    }
  }
}
```

8. Save the `mcp.json` file

#### Verify MCP is running

1. Open Cursor
2. Open Settings > Cursor Settings
3. Go to the "Tools & Integrations" tab
4. In the "MCP Tools" section locate the "Swarm" MCP
5. Check the status indicator next to the "Swarm" MCP name (it should be green if operational)

#### Controlling accessibility of MCP tools

1. Open Cursor
2. Open Settings > Cursor Settings
3. Go to the "Tools & Integrations" tab
4. In the "MCP Tools" section locate the "Swarm" MCP
5. Click on "# tool enabled" below the "Swarm" MCP name
6. You can use the individual tool names as toggles to disable/enable them to be available to the AI model

### Troubleshooting

You can refer to the [Cursor documentation](https://docs.cursor.com/en/welcome) for more information on setting up and
using MCP tools in Cursor.

To check if the AI model you intend to use supports tools, look at
the [Available models in Cursor](https://docs.cursor.com/en/models).