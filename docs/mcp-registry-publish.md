# MCP Publishing

This server is published to the Model Context Protocol (MCP) registry. Here's how the publishing process works:

## Prerequisites

- A GitHub repository with your MCP server code
- Push access to the repository with GitHub Actions enabled
- For custom domain namespaces (e.g., `buzz.solarpunkltd.*`), you'll need to set up DNS authentication

## Automated Publishing with GitHub Actions

This project includes a GitHub Actions workflow (`.github/workflows/publish-mcp.yml`) that automatically publishes the
MCP server when you create a new version tag.

To publish a new version:

1. Update the version in `package.json` and `server.json`
2. Create a new git tag with the version (prefixed with 'v'):
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

The workflow will:

1. Run tests
2. Build the package
3. Validate `server.json` against the MCP schema
4. Publish the server to the MCP registry

## Manual Publishing

If you need to publish manually:

1. Install the MCP Publisher CLI:
   ```bash
   curl -L "https://github.com/modelcontextprotocol/registry/releases/latest/download/mcp-publisher_$(uname -s | tr '[:upper:]' '[:lower:]')_$(uname -m | sed 's/x86_64/amd64/;s/aarch64/arm64/').tar.gz" | tar xz mcp-publisher
   ```

2. Log in to the MCP registry:
   ```bash
   ./mcp-publisher login github-oidc
   ```

3. Publish the server:
   ```bash
   ./mcp-publisher publish
   ```

## Validating server.json

You can validate your `server.json` file against the MCP schema using the following command:

```bash
npm install -g ajv-cli
ajv validate -s https://raw.githubusercontent.com/modelcontextprotocol/registry/main/schema/server/v1.json -d server.json --spec=draft2020
```

## Namespace and Authentication

- The server is published under the `io.github.solar-punk-ltd` namespace (GitHub organization name)
- Publishing uses GitHub OIDC for authentication, so no additional credentials are needed
- For custom domain namespaces, you'll need to set up DNS authentication as described in
  the [MCP documentation](https://github.com/modelcontextprotocol/registry/tree/main/docs/guides/publishing)
