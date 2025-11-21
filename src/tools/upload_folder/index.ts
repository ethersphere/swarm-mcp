/**
 * MCP Tool: upload_folder
 * Upload a folder to Swarm
 */
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { Bee, CollectionUploadOptions } from "@ethersphere/bee-js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import fs from "fs";
import { promisify } from "util";
import config from "../../config";
import {
  errorHasStatus,
  getErrorMessage,
  getResponseWithStructuredContent,
  ToolResponse,
} from "../../utils";
import { getUploadPostageBatchId } from "../../utils/upload-stamp";
import { UploadFolderArgs } from "./models";
import { BAD_REQUEST_STATUS } from "../../constants";

export async function uploadFolder(
  args: UploadFolderArgs,
  bee: Bee,
  transport: any
): Promise<ToolResponse> {
  if (!args.folderPath) {
    throw new McpError(
      ErrorCode.InvalidParams,
      "Missing required parameter: folderPath"
    );
  }

  // Check if in stdio mode for folder path uploads
  if (!(transport instanceof StdioServerTransport)) {
    throw new McpError(
      ErrorCode.InvalidParams,
      "Folder path uploads are only supported in stdio mode"
    );
  }

  // Check if folder exists
  const stats = await promisify(fs.stat)(args.folderPath);
  if (!stats.isDirectory()) {
    throw new McpError(
      ErrorCode.InvalidParams,
      `Path is not a directory: ${args.folderPath}`
    );
  }

  const postageBatchId = await getUploadPostageBatchId(
    args.postageBatchId,
    bee
  );

  const redundancyLevel = args.redundancyLevel;
  const options: CollectionUploadOptions = {};

  if (redundancyLevel) {
    options.redundancyLevel = redundancyLevel;
  }

  const deferred = true;
  options.deferred = deferred;
  let message = "Folder successfully uploaded to Swarm";

  let tagId: string | undefined = undefined;
  if (deferred) {
    try {
      const tag = await bee.createTag();
      tagId = tag.uid.toString();
      options.tag = tag.uid;
      message =
        "Folder upload started in deferred mode. Use query_upload_progress to track progress.";
    } catch (error) {
      options.deferred = false;
    }
  }

  let result;

  try {
    // Start the deferred upload
    result = await bee.uploadFilesFromDirectory(
      postageBatchId,
      args.folderPath,
      options
    );
  } catch (error) {
    if (errorHasStatus(error, BAD_REQUEST_STATUS)) {
      throw new McpError(ErrorCode.InvalidRequest, getErrorMessage(error));
    } else {
      throw new McpError(ErrorCode.InvalidParams, "Unable to upload folder.");
    }
  }

  return getResponseWithStructuredContent({
    reference: result.reference.toString(),
    url: config.bee.endpoint + "/bzz/" + result.reference.toString(),
    message,
    tagId,
  });
}

