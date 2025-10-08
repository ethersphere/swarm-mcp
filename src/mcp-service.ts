/**
 * MCP Service implementation for handling blob data operations with Bee (Swarm)
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { Bee } from "@ethersphere/bee-js";
import config from "./config";
// Import refactored tool modules
import { uploadText, UploadTextArgs } from "./tools/upload-text";
import { downloadText, DownloadTextArgs } from "./tools/download-text";
import { uploadFile, UploadFileArgs } from "./tools/upload-file";
import { uploadFolder, UploadFolderArgs } from "./tools/upload-folder";
import { downloadFolder, DownloadFolderArgs } from "./tools/download-folder";
import { queryUploadProgress, QueryUploadProgressArgs } from './tools/query-upload-progress';
import { listPostageStamps } from "./tools/list-postage-stamps";
import { getPostageStamp } from "./tools/get_postage_stamp";
import { ListPostageStampsArgs } from "./tools/list-postage-stamps/models";
import { GetPostageStampArgs } from "./tools/get_postage_stamp/models";
import { extendPostageStamp } from "./tools/extend_postage_stamp";
import { createPostageStamp } from "./tools/create_postage_stamp";
import { CreatePostageStampArgs } from "./tools/create_postage_stamp/models";
import { ExtendPostageStampArgs } from "./tools/extend_postage_stamp/models";
import {
  PostageBatchCuratedSchema,
  PostageBatchSummarySchema,
} from "./schemas";

/**
 * Swarm MCP Server class
 */
export class SwarmMCPServer {
  public readonly server: McpServer;
  private readonly bee: Bee;

  constructor() {
    console.error("[Setup] Initializing Swarm MCP server...");

    // Initialize Bee client with the configured endpoint
    this.bee = new Bee(config.bee.endpoint);

    this.server = new McpServer(
      {
        name: "swarm-mcp-server",
        version: "0.1.0",
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    this.setupToolHandlers();

    this.server.server.onerror = (error: Error) =>
      console.error("[Error]", error);

    process.on("SIGINT", async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers() {
    this.server.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "upload_text",
          description: "Upload text data to Swarm",
          inputSchema: {
            type: "object",
            properties: {
              data: {
                type: "string",
                description: "arbitrary string to upload",
              },
              redundancyLevel: {
                type: "number",
                description:
                  "redundancy level for fault tolerance " +
                  "(higher values provide better fault tolerance but increase storage overhead)" +
                  "0 - none, 1 - medium, 2 - strong, 3 - insane, 4 - paranoid",
                default: 0,
              },
              memoryTopic: {
                type: "string",
                description:
                  "If provided, uploads the data to a feed with this topic." +
                  "It is the label of the memory that can be used later to retrieve the data instead of its content hash." +
                  "If not a hex string, it will be hashed to create a feed topic",
              },
            },
            required: ["data"],
          },
        },
        {
          name: "download_text",
          description:
            "Retrieve text data from Swarm. Only use it if text or textformat is wanted",
          inputSchema: {
            type: "object",
            properties: {
              reference: {
                type: "string",
                description: "Swarm reference hash or memory/feed topic",
              },
              isMemoryTopic: {
                type: "boolean",
                description:
                  "When accessing memory or feed related data, this parameter must be true",
                default: false,
              },
              owner: {
                type: "string",
                description:
                  "when accessing external memory or feed, ethereum address of the owner must be set",
              },
            },
            required: ["reference"],
          },
        },
        {
          name: "upload_file",
          description: "Upload a file to Swarm",
          inputSchema: {
            type: "object",
            properties: {
              data: {
                type: "string",
                description: "base64 encoded file content or file path",
              },
              isPath: {
                type: "boolean",
                description: "whether the data parameter is a file path",
                default: false,
              },
              redundancyLevel: {
                type: "number",
                description:
                  "redundancy level for fault tolerance " +
                  "(higher values provide better fault tolerance but increase storage overhead)" +
                  "0 - none, 1 - medium, 2 - strong, 3 - insane, 4 - paranoid",
                default: 0,
              },
            },
            required: ["data"],
          },
        },
        {
          name: "upload_folder",
          description: "Upload a folder to Swarm",
          inputSchema: {
            type: "object",
            properties: {
              folderPath: {
                type: "string",
                description: "path to the folder to upload",
              },
              redundancyLevel: {
                type: "number",
                description:
                  "redundancy level for fault tolerance " +
                  "(higher values provide better fault tolerance but increase storage overhead)" +
                  "0 - none, 1 - medium, 2 - strong, 3 - insane, 4 - paranoid",
                default: 0,
              },
            },
            required: ["folderPath"],
          },
        },
        {
          name: "download_folder",
          description:
            "Download folder, files or binary data from a Swarm reference and save to file path or return file list of the reference" +
            "prioritizes this tool over download_text if there is no assumption about the data type",
          inputSchema: {
            type: "object",
            properties: {
              reference: {
                type: "string",
                description: "Swarm reference hash",
              },
              filePath: {
                type: "string",
                description:
                  "Optional file path to save the downloaded content (only available in stdio mode)." +
                  "if not provided list of files in the manifest will be returned",
              },
            },
            required: ["reference"],
          },
        },
        {
          name: "list_postage_stamps",
          description:
            "List the available postage stamps. Options: leastUsed, limit, minUsage(%), maxUsage(%).",
          inputSchema: {
            type: "object",
            properties: {
              leastUsed: {
                type: "boolean",
                description:
                  "A boolean value that tells if stamps are sorted so least used comes first." +
                  "true - means that stamps should be sorted" +
                  "false - means that stamps should not be sorted",
                default: false,
              },
              limit: {
                type: "number",
                description: "Limit is the maximum number of returned stamps.",
              },
              minUsage: {
                type: "number",
                description:
                  "Only list stamps with at least this usage percentage",
              },
              maxUsage: {
                type: "number",
                description:
                  "Only list stamps with at most this usage percentage.",
              },
            },
          },
          outputSchema: {
            type: "object",
            properties: {
              raw: {
                type: "array",
                raw: PostageBatchCuratedSchema,
              },
              summary: {
                type: "array",
                summary: PostageBatchSummarySchema,
              },
            },
            required: ["summary"],
          },
        },
        {
          name: "get_postage_stamp",
          description: "Get a specific postage stamp based on postageBatchId.",
          inputSchema: {
            type: "object",
            properties: {
              postageBatchId: {
                type: "string",
                description: "The id of the stamp which is requested.",
                default: false,
              },
            },
            required: ["postageBatchId"],
          },
          outputSchema: {
            type: "object",
            properties: {
              raw: PostageBatchCuratedSchema,
              summary: PostageBatchSummarySchema,
            },
            required: ["summary"],
          },
        },
        {
          name: "create_postage_stamp",
          description:
            "Buy postage stamp based on size in megabytes and duration.",
          inputSchema: {
            type: "object",
            properties: {
              size: {
                type: "number",
                description:
                  "The storage size in MB (Megabytes)." +
                  "These other size units convert like this to MB: 1 byte = 0.000001 MB, 1  KB = 0.001 MB, 1GB= 1000MB",
              },
              duration: {
                type: "string",
                description:
                  "Duration for which the data should be stored." +
                  "Time to live of the postage stamp, e.g. 1d - 1 day, 1w - 1 week, 1month - 1 month ",
              },
              label: {
                type: "string",
                description:
                  "Sets label for the postage batch (omit if the user didn't ask for one). Do not set a label with with specific capacity values because they can get misleading.",
              },
            },
            required: ["size", "duration"],
          },
        },
        {
          name: "extend_postage_stamp",
          description:
            "Increase the duration (relative to current duration) or size (in megabytes) of a postage stamp.",
          inputSchema: {
            type: "object",
            properties: {
              postageBatchId: {
                type: "string",
                description:
                  "The id of the batch for which extend is performed.",
                default: false,
              },
              size: {
                type: "number",
                description:
                  "The storage size in MB (Megabytes)." +
                  "These other size units convert like this to MB: 1 byte = 0.000001 MB, 1  KB = 0.001 MB, 1GB= 1000MB",
              },
              duration: {
                type: "string",
                description:
                  "Duration for which the data should be stored." +
                  "Time to live of the postage stamp, e.g. 1d - 1 day, 1w - 1 week, 1month - 1 month ",
              },
            },
            required: ["postageBatchId"],
          },
          outputSchema: {
            type: "object",
            properties: {
              postageBatchId: {
                type: "string",
                description:
                  "The id of the postage batch for which the top up occurred.",
              },
            },
            required: ["postageBatchId"],
          },
        },
        {
          name: 'query_upload_progress',
          description: 'Query upload progress for a specific upload session identified with the returned Tag ID',
          inputSchema: {
            type: 'object',
            properties: {
              tagId: {
                type: 'string',
                description: 'Tag ID returned by upload_file and upload_folder tools to track upload progress',
              },
            },
            required: ['tagId'],
          },
        },
      ],
    }));

    this.server.server.setRequestHandler(
      CallToolRequestSchema,
      async (request) => {
        // Extract arguments from the request
        const args = request.params.arguments;

        // Call the appropriate tool based on the request name
        switch (request.params.name) {
          case "upload_text":
            return uploadText(args as unknown as UploadTextArgs, this.bee);

          case "download_text":
            return downloadText(args as unknown as DownloadTextArgs, this.bee);

          case "upload_file":
            return uploadFile(
              args as unknown as UploadFileArgs,
              this.bee,
              this.server.server.transport
            );

          case "upload_folder":
            return uploadFolder(
              args as unknown as UploadFolderArgs,
              this.bee,
              this.server.server.transport
            );

          case "download_folder":
            return downloadFolder(
              args as unknown as DownloadFolderArgs,
              this.bee,
              this.server.server.transport
            );
            
          case 'query_upload_progress':
            return queryUploadProgress(args as unknown as QueryUploadProgressArgs, this.bee, this.server.server.transport);

          case "list_postage_stamps":
            return listPostageStamps(
              args as unknown as ListPostageStampsArgs,
              this.bee
            );

          case "get_postage_stamp":
            return getPostageStamp(
              args as unknown as GetPostageStampArgs,
              this.bee
            );

          case "create_postage_stamp":
            return createPostageStamp(
              args as unknown as CreatePostageStampArgs,
              this.bee
            );

          case "extend_postage_stamp":
            return extendPostageStamp(
              args as unknown as ExtendPostageStampArgs,
              this.bee
            );
        }

        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${request.params.name}`
        );
      }
    );
  }
}
