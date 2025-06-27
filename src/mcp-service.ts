/**
 * MCP Service implementation for handling blob data operations with Bee (Swarm)
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError } from '@modelcontextprotocol/sdk/types.js';
import { Bee } from '@ethersphere/bee-js';
import config from './config';

/**
 * Swarm MCP Server class
 */
class SwarmMCPServer {
  private server: McpServer;
  private bee: Bee;

  constructor() {
    console.error('[Setup] Initializing Swarm MCP server...');

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
              isFile: {
                type: 'boolean',
                description: 'whether the data is encoded in base64',
                default: false
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
              isFile: {
                type: 'boolean',
                description: 'whether to return the result as file content',
                default: false
              },
            },
            required: ['reference'],
          },
        },
      ],
    }));

    this.server.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        if (!['upload_text', 'download_text'].includes(request.params.name)) {
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${request.params.name}`
          );
        }

        if (request.params.name === 'upload_text') {
          const args = request.params.arguments as {
            data: string;
            isFile?: boolean;
          };

          if (!args.data) {
            throw new McpError(
              ErrorCode.InvalidParams,
              'Missing required parameter: data'
            );
          }

          console.error(`[API] Uploading blob data to Swarm...`);
          try {
            // Handle base64 encoded data if specified
            const binaryData = args.isFile 
              ? Buffer.from(args.data, 'base64')
              : Buffer.from(args.data);
            const result = await this.bee.uploadData(config.bee.postageBatchId, binaryData);
            
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    reference: result.reference.toString(),
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
        } else {
          // download_text
          const args = request.params.arguments as {
            reference: string;
            isFile?: boolean;
          };

          if (!args.reference) {
            throw new McpError(
              ErrorCode.InvalidParams,
              'Missing required parameter: reference'
            );
          }

          console.error(`[API] Downloading blob from Swarm with reference: ${args.reference}`);
          try {
            const data = await this.bee.downloadData(args.reference);
            
            // Return as base64 or UTF-8 based on isBase64 flag
            if (args.isFile) {
              return {
                content: [
                  {
                    type: 'blob',
                    data: data.toBase64(),
                  },
                ],
              };
            } else {
              return {
                content: [
                  {
                    type: 'text',
                    text: data.toUtf8(),
                  },
                ],
              };
            }
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
    console.error('Swarm MCP server running on stdio');
  }
}

export default new SwarmMCPServer();
