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
import { uploadData } from "./tools/upload_data";
import { downloadData } from "./tools/download_data";
import { uploadFile } from "./tools/upload_file";
import { uploadFolder } from "./tools/upload_folder";
import { downloadFiles } from "./tools/download_files";
import { queryUploadProgress } from "./tools/query_upload_progress";
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
import { updateFeed } from "./tools/update_feed";
import { readFeed } from "./tools/read_feed";
import { UploadDataArgs } from "./tools/upload_data/models";
import { DownloadDataArgs } from "./tools/download_data/models";
import { UpdateFeedArgs } from "./tools/update_feed/models";
import { ReadFeedArgs } from "./tools/read_feed/models";
import { UploadFileArgs } from "./tools/upload_file/models";
import { UploadFolderArgs } from "./tools/upload_folder/models";
import { DownloadFilesArgs } from "./tools/download_files/models";
import { QueryUploadProgressArgs } from "./tools/query_upload_progress/models";

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
          name: "upload_data",
          description:
            "Upload text data to Swarm. Optional options (ignore if they are not requested): " +
            "redundancyLevel: redundancy level for fault tolerance. Optional, value is 0 if not requested. " +
            "postageBatchId: The postage stamp batch ID which will be used to perform the upload, if it is provided.",
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
                  "(higher values provide better fault tolerance but increase storage overhead) " +
                  "0 - none, 1 - medium, 2 - strong, 3 - insane, 4 - paranoid",
                default: 0,
              },
              postageBatchId: {
                type: "string",
                description:
                  "The id of the batch which will be used to perform the upload.",
                default: undefined,
              },
            },
            required: ["data"],
          },
          outputSchema: {
            type: "object",
            properties: {
              reference: {
                type: "string",
                description: "Swarm reference hash for uploaded data.",
              },
              url: {
                type: "string",
                description: "URL to access uploaded data.",
              },
              message: {
                type: "string",
                description: "Upload response message.",
              },
            },
            required: ["reference", "url"],
          },
        },
        {
          name: "update_feed",
          description:
            "Update the feed of a given topic with new data. Optional options (ignore if they are not requested): " +
            "postageBatchId: The postage stamp batch ID which will be used to perform the upload, if it is provided.",
          inputSchema: {
            type: "object",
            properties: {
              data: {
                type: "string",
                description: "arbitrary string to upload",
              },
              memoryTopic: {
                type: "string",
                description:
                  "If provided, uploads the data to a feed with this topic. " +
                  "It is the label of the memory that can be used later to retrieve the data instead of its content hash. " +
                  "If not a hex string, it will be hashed to create a feed topic",
              },
              postageBatchId: {
                type: "string",
                description:
                  "The id of the batch which will be used to perform the upload.",
                default: undefined,
              },
            },
            required: ["data", "memoryTopic"],
          },
          outputSchema: {
            type: "object",
            properties: {
              reference: {
                type: "string",
                description: "Swarm reference hash for feed update.",
              },
              topicString: {
                type: "string",
                description: "The topic string.",
              },
              topic: {
                type: "string",
                description: "The topic.",
              },
              feedUrl: {
                type: "string",
                description: "The feed URL.",
              },
              message: {
                type: "string",
                description: "Update feed response message.",
              },
            },
            required: ["reference", "topic", "feedUrl"],
          },
        },
        {
          name: "download_data",
          description:
            "Downloads immutable data from a Swarm content address hash.",
          inputSchema: {
            type: "object",
            properties: {
              reference: {
                type: "string",
                description: "Swarm reference hash.",
              },
            },
            required: ["reference"],
          },
          outputSchema: {
            type: "object",
            properties: {
              textData: {
                type: "string",
                description: "The downloaded data for the given reference.",
              },
            },
            required: ["textData"],
          },
        },
        {
          name: "read_feed",
          description:
            "Retrieve the latest data from the feed of a given topic.",
          inputSchema: {
            type: "object",
            properties: {
              memoryTopic: {
                type: "string",
                description: "Feed topic.",
              },
              owner: {
                type: "string",
                description:
                  "when accessing external memory or feed, ethereum address of the owner must be set",
              },
            },
            required: ["memoryTopic"],
          },
          outputSchema: {
            type: "object",
            properties: {
              textData: {
                type: "string",
                description: "The downloaded data for the given topic.",
              },
            },
            required: ["textData"],
          },
        },
        {
          name: "upload_file",
          description:
            "Upload a file to Swarm. Optional options (ignore if they are not requested): " +
            "isPath: wether the data parameter is a path. " +
            "redundancyLevel: redundancy level for fault tolerance. Optional, value is 0 if not requested. " +
            "postageBatchId: The postage stamp batch ID which will be used to perform the upload, if it is provided.",
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
                  "(higher values provide better fault tolerance but increase storage overhead) " +
                  "0 - none, 1 - medium, 2 - strong, 3 - insane, 4 - paranoid",
                default: 0,
              },
              postageBatchId: {
                type: "string",
                description:
                  "The id of the batch which will be used to perform the upload.",
                default: undefined,
              },
            },
            required: ["data"],
          },
          outputSchema: {
            type: "object",
            properties: {
              reference: {
                type: "string",
                description: "Swarm reference hash for uploaded file.",
              },
              url: {
                type: "string",
                description: "The URL to access the uploaded file.",
              },
              message: {
                type: "string",
                description: "Upload file response message.",
              },
              tagId: {
                type: "string",
                description: "The tag ID for deferred uploads.",
              },
            },
            required: ["reference", "url"],
          },
        },
        {
          name: "upload_folder",
          description:
            "Upload a folder to Swarm. Optional options (ignore if they are not requested): " +
            "folderPath: path to the folder to upload. " +
            "redundancyLevel: redundancy level for fault tolerance. Optional, value is 0 if not requested. " +
            "postageBatchId: The postage stamp batch ID which will be used to perform the upload, if it is provided.",
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
                  "(higher values provide better fault tolerance but increase storage overhead) " +
                  "0 - none, 1 - medium, 2 - strong, 3 - insane, 4 - paranoid",
                default: 0,
              },
              postageBatchId: {
                type: "string",
                description:
                  "The id of the batch which will be used to perform the upload.",
                default: undefined,
              },
            },
            required: ["folderPath"],
          },
          outputSchema: {
            type: "object",
            properties: {
              reference: {
                type: "string",
                description: "Swarm reference hash for uploaded folder.",
              },
              url: {
                type: "string",
                description: "The URL to access the uploaded folder.",
              },
              message: {
                type: "string",
                description: "Upload folder response message.",
              },
              tagId: {
                type: "string",
                description: "The tag ID for deferred uploads.",
              },
            },
            required: ["reference", "url"],
          },
        },
        {
          name: "download_files",
          description:
            "Download folder, files or binary data from a Swarm reference and save to file path or return file list of the reference " +
            "prioritizes this tool over download_data if there is no assumption about the data type",
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
                  "Optional file path to save the downloaded content (only available in stdio mode). " +
                  "if not provided list of files in the manifest will be returned",
              },
            },
            required: ["reference"],
          },
        },
        {
          name: "list_postage_stamps",
          description:
            "List the available postage stamps. Optional options (ignore if they are not requested): leastUsed, limit, minUsage(%), maxUsage(%).",
          inputSchema: {
            type: "object",
            properties: {
              leastUsed: {
                type: "boolean",
                description:
                  "A boolean value that tells if stamps are sorted so least used comes first. " +
                  "true - means that stamps should be sorted " +
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
                  "The storage size in MB (Megabytes). " +
                  "These other size units convert like this to MB: 1 byte = 0.000001 MB, 1  KB = 0.001 MB, 1GB= 1000MB",
              },
              duration: {
                type: "string",
                description:
                  "Duration for which the data should be stored. " +
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
              },
              size: {
                type: "number",
                description:
                  "The storage size in MB (Megabytes). " +
                  "These other size units convert like this to MB: 1 byte = 0.000001 MB, 1  KB = 0.001 MB, 1GB= 1000MB",
              },
              duration: {
                type: "string",
                description:
                  "Duration for which the data should be stored. " +
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
          name: "query_upload_progress",
          description:
            "Query upload progress for a specific upload session identified with the returned Tag ID",
          inputSchema: {
            type: "object",
            properties: {
              tagId: {
                type: "string",
                description:
                  "Tag ID returned by upload_file and upload_folder tools to track upload progress",
              },
            },
            required: ["tagId"],
          },
          outputSchema: {
            type: "object",
            properties: {
              processedPercentage: {
                type: "number",
                description: "The deferred upload processed percentage.",
              },
              message: {
                type: "string",
                description: "Query upload response message.",
              },
              startedAt: {
                type: "string",
                description: "When it started.",
              },
              tagAddress: {
                type: "string",
                description: "The address of the tag.",
              },
            },
            required: ["processedPercentage", "tagAddress"],
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
          case "upload_data":
            return uploadData(args as unknown as UploadDataArgs, this.bee);

          case "download_data":
            return downloadData(args as unknown as DownloadDataArgs, this.bee);

          case "update_feed":
            return updateFeed(args as unknown as UpdateFeedArgs, this.bee);

          case "read_feed":
            return readFeed(args as unknown as ReadFeedArgs, this.bee);

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

          case "download_files":
            return downloadFiles(
              args as unknown as DownloadFilesArgs,
              this.bee,
              this.server.server.transport
            );

          case "query_upload_progress":
            return queryUploadProgress(
              args as unknown as QueryUploadProgressArgs,
              this.bee,
              this.server.server.transport
            );

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
