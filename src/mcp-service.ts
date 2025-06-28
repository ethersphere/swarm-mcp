/**
 * MCP Service implementation for handling blob data operations with Bee (Swarm)
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError } from '@modelcontextprotocol/sdk/types.js';
import { Bee } from '@ethersphere/bee-js';
import config from './config';
import fs from 'fs';
import { promisify } from 'util';

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
            },
            required: ['data'],
          },
        },
        {
          name: 'download_text',
          description: 'Retrieve text data from Swarm',
          inputSchema: {
            type: 'object',
            properties: {
              reference: {
                type: 'string',
                description: 'Swarm reference hash',
              },
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
      ],
    }));

    this.server.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        if (!['upload_text', 'download_text', 'upload_file', 'upload_folder'].includes(request.params.name)) {
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${request.params.name}`
          );
        }

        if (request.params.name === 'upload_text') {
          const args = request.params.arguments as {
            data: string;
            redundancyLevel?: number;
          };

          if (!args.data) {
            throw new McpError(
              ErrorCode.InvalidParams,
              'Missing required parameter: data'
            );
          }

          try {
            const binaryData = Buffer.from(args.data);

            const redundancyLevel = args.redundancyLevel;
            const options = redundancyLevel ? { redundancyLevel } : undefined;
            
            const result = await this.bee.uploadData(config.bee.postageBatchId, binaryData, options);
            
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    reference: result.reference.toString(),
                    url: config.bee.endpoint + '/bytes/' + result.reference.toString(),
                    message: 'Data successfully uploaded to Swarm',
                  }, null, 2),
                },
              ],
            };
          } catch (error) {
            if (error instanceof Error) {
              throw new Error(`Error uploading to Swarm: ${error.message}`);
            }
            throw error;
          }
        } else if (request.params.name === 'upload_file') {
          const args = request.params.arguments as {
            data: string;
            isPath?: boolean;
            redundancyLevel?: number;
          };

          if (!args.data) {
            throw new McpError(
              ErrorCode.InvalidParams,
              'Missing required parameter: data'
            );
          }

          try {
            let binaryData: Buffer;
            let name: string | undefined;
            
            if (args.isPath) {
              // Check if in stdio mode for file path uploads
              if (!(this.server.server.transport instanceof StdioServerTransport)) {
                throw new McpError(
                  ErrorCode.InvalidParams,
                  'File path uploads are only supported in stdio mode'
                );
              }
              
              // Read file from path
              try {
                binaryData = await promisify(fs.readFile)(args.data);
              } catch (fileError) {
                throw new McpError(
                  ErrorCode.InvalidParams,
                  `Unable to read file at path: ${args.data}`
                );
              }
              name = args.data.split('/').pop();
            } else {
              // Treat as base64 encoded content
              binaryData = Buffer.from(args.data, 'base64');
            }
            
            const result = await this.bee.uploadFile(config.bee.postageBatchId, binaryData, name);
            
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    reference: result.reference.toString(),
                    url: config.bee.endpoint + '/bzz/' + result.reference.toString(),
                    message: 'File successfully uploaded to Swarm',
                  }, null, 2),
                },
              ],
            };
          } catch (error) {
            if (error instanceof McpError) {
              throw error;
            }
            if (error instanceof Error) {
              throw new Error(`Error uploading file to Swarm: ${error.message}`);
            }
            throw error;
          }
        } else if (request.params.name === 'upload_folder') {
          const args = request.params.arguments as {
            folderPath: string;
            redundancyLevel?: number;
          };

          if (!args.folderPath) {
            throw new McpError(
              ErrorCode.InvalidParams,
              'Missing required parameter: folderPath'
            );
          }

          // Check if in stdio mode for folder path uploads
          if (!(this.server.server.transport instanceof StdioServerTransport)) {
            throw new McpError(
              ErrorCode.InvalidParams,
              'Folder path uploads are only supported in stdio mode'
            );
          }

          try {
            // Check if folder exists
            try {
              const stats = await promisify(fs.stat)(args.folderPath);
              if (!stats.isDirectory()) {
                throw new McpError(
                  ErrorCode.InvalidParams,
                  `Path is not a directory: ${args.folderPath}`
                );
              }
            } catch (statError) {
              throw new McpError(
                ErrorCode.InvalidParams,
                `Unable to access directory at path: ${args.folderPath}`
              );
            }

            const redundancyLevel = args.redundancyLevel;
            const options = redundancyLevel ? { redundancyLevel } : undefined;
            
            const result = await this.bee.uploadFilesFromDirectory(config.bee.postageBatchId, args.folderPath, options);
            
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    reference: result.reference.toString(),
                    url: config.bee.endpoint + '/bzz/' + result.reference.toString(),
                    message: 'Folder successfully uploaded to Swarm',
                  }, null, 2),
                },
              ],
            };
          } catch (error) {
            if (error instanceof McpError) {
              throw error;
            }
            if (error instanceof Error) {
              throw new Error(`Error uploading folder to Swarm: ${error.message}`);
            }
            throw error;
          }
        } else {
          // download_text
          const args = request.params.arguments as {
            reference: string;
          };

          if (!args.reference) {
            throw new McpError(
              ErrorCode.InvalidParams,
              'Missing required parameter: reference'
            );
          }

          console.log(`[API] Downloading blob from Swarm with reference: ${args.reference}`);
          try {
            const data = await this.bee.downloadData(args.reference);
            const textData = data.toUtf8();
            return {
              content: [
                {
                  type: 'text',
                  text: textData,
                },
              ],
            };
          } catch (error) {
            if (error instanceof Error) {
              throw new Error(`Error downloading from Swarm: ${error.message}`);
            }
            throw error;
          }
        }
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.error('[Error] Failed to perform operation:', error);
          throw new McpError(
            ErrorCode.InternalError,
            `Failed to perform operation: ${error.message}`
          );
        }
        throw error;
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.log('Swarm MCP server running on stdio');
  }
}

export default new SwarmMCPServer();
