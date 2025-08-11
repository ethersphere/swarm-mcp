# Swarm MCP Prompt Examples

This document provides example prompts for interacting with the Swarm MCP (Model Context Protocol) through various MCP
clients like [Claude Desktop](https://claude.ai/download) and [Windsurf](https://windsurf.com/download). These examples
demonstrate how to effectively use the Swarm MCP tools for different scenarios.

## Table of Contents

- [Uploading Content](#uploading-content)
- [Downloading Content](#downloading-content)
- [Working with Folders](#working-with-folders)
- [Memory and Feed Operations](#memory-and-feed-operations)
- [Troubleshooting](#troubleshooting)

## Uploading Content

### Upload a Text File

```
Upload the following text to Swarm and give me the reference:
"This is a sample text that I want to store on Swarm."
```

### Upload a File from Disk

```
Upload the file located at '/path/to/my/document.pdf' to Swarm.
```

### Upload with Specific Redundancy Level

```
Upload 'important-data.json' to Swarm with high redundancy (level 3).
```

## Downloading Content

### Download by Reference

```
Download and show me the content of this Swarm reference: 1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
```

### Download and Save to File

```
Download the content from reference 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef' and save it as 'downloaded_content.txt' on my desktop.
```

## Working with Folders

### Upload a Folder

```
Upload the entire folder at '/path/to/my/project' to Swarm.
```

### Download a Folder

```
Download the folder with reference 'f1e2d3c4b5a67890123456789abcdef0123456789abcdef0123456789abcdef' to my current directory.
```

## Memory and Feed Operations

### Upload to Memory Topic

```
Upload this configuration to my personal feed with topic 'app-settings':
{
  "theme": "dark",
  "notifications": true,
  "autoUpdate": true
}
```

### Read from Memory Topic

```
Retrieve the latest content from my feed with topic 'app-settings'.
```

### Update Feed Content

```
Update my 'app-settings' feed with these new values, keeping existing ones where not specified:
{
  "theme": "light",
  "notifications": false
}
```

## Troubleshooting

### Check Connection

```
Verify the connection to the Swarm node and show me the status.
```

### Check Upload Status

```
What's the status of my last upload? The reference was '9a8b7c6d5e4f30123456789abcdef0123456789abcdef0123456789abcdef'
```

### Get Help with Commands

```
Show me all available Swarm MCP commands and their parameters.
```

## Best Practices

1. **Be Specific**: Always specify the exact file paths and references when possible.
2. **Check Resources**: Before large uploads, check your postage stamp balance and node status (if you are not using the
   default Swarm Gateway).
3. **Use Metadata**: When uploading, consider adding metadata as a separate file to describe your content.
4. **Batch Operations**: For multiple files, consider zipping them first or using folder uploads.
5. **Security**: Never share private keys. Never share sensitive information in prompts without proper access control.

## Integration Examples

### With Claude Desktop

```
I need to share this documentation with my team. Please upload it to Swarm and give me a shareable link.
```

### With Windsurf

```
I'm working on a project that needs to store user-uploaded content. Show me how to use the Swarm MCP to handle file uploads and retrievals in my code.
```

## Notes

- All operations require proper configuration of the Swarm MCP client with valid credentials.
- The actual response format may vary slightly depending on the MCP client you're using.
- Some operations might require additional permissions (like file-system access) or setup in your MCP client.
