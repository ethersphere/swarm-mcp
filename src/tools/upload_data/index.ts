/**
 * MCP Tool: upload_data
 * Uploads text data to Swarm.
 */
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { Bee } from "@ethersphere/bee-js";
import config from "../../config";
import {
  errorHasStatus,
  getErrorMessage,
  getResponseWithStructuredContent,
  ToolResponse,
} from "../../utils";
import { getUploadPostageBatchId } from "../../utils/upload-stamp";
import { UploadDataArgs } from "./models";
import { BAD_REQUEST_STATUS } from "../../constants";

export async function uploadData(
  args: UploadDataArgs,
  bee: Bee
): Promise<ToolResponse> {
  if (!args.data) {
    throw new McpError(
      ErrorCode.InvalidParams,
      "Missing required parameter: data"
    );
  }

  const postageBatchId = await getUploadPostageBatchId(
    args.postageBatchId,
    bee
  );

  const binaryData = Buffer.from(args.data);

  const redundancyLevel = args.redundancyLevel;
  const options = redundancyLevel ? { redundancyLevel } : undefined;

  let result;

  try {
    result = await bee.uploadData(postageBatchId, binaryData, options);
  } catch (error) {
    if (errorHasStatus(error, BAD_REQUEST_STATUS)) {
      throw new McpError(ErrorCode.InvalidRequest, getErrorMessage(error));
    } else {
      throw new McpError(ErrorCode.InvalidParams, "Unable to upload data.");
    }
  }

  return getResponseWithStructuredContent({
    reference: result.reference.toString(),
    url: config.bee.endpoint + "/bytes/" + result.reference.toString(),
    message: "Data successfully uploaded to Swarm",
  });
}
