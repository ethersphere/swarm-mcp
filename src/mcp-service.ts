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
import { listPostageStamps } from "./tools/list_postage_stamps";
import { getPostageStamp } from "./tools/get_postage_stamp";
import { ListPostageStampsArgs } from "./tools/list_postage_stamps/models";
import { GetPostageStampArgs } from "./tools/get_postage_stamp/models";
import { extendPostageStamp } from "./tools/extend_postage_stamp";
import { createPostageStamp } from "./tools/create_postage_stamp";
import { CreatePostageStampArgs } from "./tools/create_postage_stamp/models";
import { ExtendPostageStampArgs } from "./tools/extend_postage_stamp/models";
import {
  PostageBatchCuratedSchema,
  PostageBatchSummarySchema,
  SwarmToolsSchema,
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
import { determineIfGateway } from "./utils";

/**
 * Swarm MCP Server class
 */
export class SwarmMCPServer {
  public readonly server: McpServer;
  private readonly bee: Bee;

  constructor() {
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
    const nodeOnlyTools = [
      "list_postage_stamps",
      "get_postage_stamp",
      "create_postage_stamp",
      "extend_postage_stamp",
      "query_upload_progress",
    ];

    this.server.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const isGateway = await determineIfGateway(this.bee);

      let tools = SwarmToolsSchema;
      if (isGateway) {
        tools = SwarmToolsSchema.filter(
          (item) => !nodeOnlyTools.includes(item.name)
        );
      }

      return {
        tools,
      };
    });

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

