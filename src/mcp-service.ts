/**
 * MCP Service implementation for handling blob data operations with Bee (Swarm)
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError } from '@modelcontextprotocol/sdk/types.js';
import { Bee } from '@ethersphere/bee-js';
import config from './config';
// Import refactored tool modules
import { uploadText, UploadTextArgs } from './tools/upload-text';
import { downloadText, DownloadTextArgs } from './tools/download-text';
import { uploadFile, UploadFileArgs } from './tools/upload-file';
import { uploadFolder, UploadFolderArgs } from './tools/upload-folder';
import { downloadFolder, DownloadFolderArgs } from './tools/download-folder';

/**
 * Swarm MCP Server class
 */
class SwarmMCPServer {
  private server: McpServer;
  private bee: Bee;

  constructor() {
    console.log('[Setup] Initializing Swarm MCP server...');

    // Initialize Bee client with the configured endpoint
    this.bee = new Bee(config.bee.endpoint);

    this.server = new McpServer(
      {
        name: 'swarm-mcp-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    this.setupToolHandlers();

    this.server.server.onerror = (error: Error) => console.error('[Error]', error);

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers() {
    this.server.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'upload_text',
          description: 'Upload text data to Swarm',
          inputSchema: {
            type: 'object',
            properties: {
              data: {
                type: 'string',
                description: 'arbitrary string to upload',
              },
              redundancyLevel: {
                type: 'number',
                description: 'redundancy level for fault tolerance ' +
                '(higher values provide better fault tolerance but increase storage overhead)'+
                '0 - none, 1 - medium, 2 - strong, 3 - insane, 4 - paranoid',
                default: 0
              },
              memoryTopic: {
                type: 'string',
                description: 'If provided, uploads the data to a feed with this topic.'+
                'It is the label of the memory that can be used later to retrieve the data instead of its content hash.'+
                'If not a hex string, it will be hashed to create a feed topic',
              },
            },
            required: ['data'],
          },
        },
        {
          name: 'download_text',
          description: 'Retrieve text data from Swarm. Only use it if text or textformat is wanted',
          inputSchema: {
            type: 'object',
            properties: {
              reference: {
                type: 'string',
                description: 'Swarm reference hash or memory/feed topic',
              },
              isMemoryTopic: {
                type: 'boolean',
                description: 'When accessing memory or feed related data, this parameter must be true',
                default: false
              },
              owner: {
                type: 'string',
                description: 'when accessing external memory or feed, ethereum address of the owner must be set',
              }
            },
            required: ['reference'],
          },
        },
        {
          name: 'upload_file',
          description: 'Upload a file to Swarm',
          inputSchema: {
            type: 'object',
            properties: {
              data: {
                type: 'string',
                description: 'base64 encoded file content or file path',
              },
              isPath: {
                type: 'boolean',
                description: 'whether the data parameter is a file path',
                default: false
              },
              redundancyLevel: {
                type: 'number',
                description: 'redundancy level for fault tolerance ' +
                '(higher values provide better fault tolerance but increase storage overhead)'+
                '0 - none, 1 - medium, 2 - strong, 3 - insane, 4 - paranoid',
                default: 0
              }
            },
            required: ['data'],
          },
        },
        {
          name: 'upload_folder',
          description: 'Upload a folder to Swarm',
          inputSchema: {
            type: 'object',
            properties: {
              folderPath: {
                type: 'string',
                description: 'path to the folder to upload',
              },
              redundancyLevel: {
                type: 'number',
                description: 'redundancy level for fault tolerance ' +
                '(higher values provide better fault tolerance but increase storage overhead)'+
                '0 - none, 1 - medium, 2 - strong, 3 - insane, 4 - paranoid',
                default: 0
              }
            },
            required: ['folderPath'],
          },
        },
        {
          name: 'download_folder',
          description: 'Download folder, files or binary data from a Swarm reference and save to file path or return file list of the reference'+
          'prioritizes this tool over download_text if there is no assumption about the data type',
          inputSchema: {
            type: 'object',
            properties: {
              reference: {
                type: 'string',
                description: 'Swarm reference hash',
              },
              filePath: {
                type: 'string',
                description: 'Optional file path to save the downloaded content (only available in stdio mode).'+
                'if not provided list of files in the manifest will be returned'
              }
            },
            required: ['reference'],
          },
        },
      ],
    }));

    this.server.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      // Extract arguments from the request
      const args = request.params.arguments;
      
      // Call the appropriate tool based on the request name
      switch (request.params.name) {
        case 'upload_text':
          return uploadText(args as unknown as UploadTextArgs, this.bee);
          
        case 'download_text':
          return downloadText(args as unknown as DownloadTextArgs, this.bee);
          
        case 'upload_file':
          return uploadFile(args as unknown as UploadFileArgs, this.bee, this.server.server.transport);
          
        case 'upload_folder':
          return uploadFolder(args as unknown as UploadFolderArgs, this.bee, this.server.server.transport);
          
        case 'download_folder':
          return downloadFolder(args as unknown as DownloadFolderArgs, this.bee, this.server.server.transport);
      }

      throw new McpError(
        ErrorCode.MethodNotFound,
        `Unknown tool: ${request.params.name}`
      );
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.log('Swarm MCP server running on stdio');
  }
}

export default new SwarmMCPServer();
