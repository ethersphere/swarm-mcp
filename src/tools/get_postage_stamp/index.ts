/**
 * MCP Tool: get_postage_stamp
 * Show a specific postage stamp.
 */
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { Bee } from "@ethersphere/bee-js";
import {
  errorHasStatus,
  getBatchSummary,
  getResponseWithStructuredContent,
  ToolResponse,
} from "../../utils";
import { GetPostageStampArgs } from "./models";
import {
  PostageBatchCurated,
  PostageBatchSummary,
  ResponseContent,
} from "../../models";
import { GATEWAY_STAMP_ERROR_MESSAGE, NOT_FOUND_STATUS } from "../../constants";

export async function getPostageStamp(
  args: GetPostageStampArgs,
  bee: Bee
): Promise<ToolResponse> {
  const { postageBatchId } = args;
  if (!postageBatchId) {
    throw new McpError(
      ErrorCode.InvalidParams,
      "Missing required parameter: postageBatchId"
    );
  }

  let rawPostageBatch;

  try {
    rawPostageBatch = await bee.getPostageBatch(postageBatchId);
  } catch (error) {
    if (errorHasStatus(error, NOT_FOUND_STATUS)) {
      throw new McpError(ErrorCode.MethodNotFound, GATEWAY_STAMP_ERROR_MESSAGE);
    } else {
      throw new McpError(
        ErrorCode.InvalidParams,
        "Retrieval of postage batch failed."
      );
    }
  }

  const batch: PostageBatchCurated = {
    ...rawPostageBatch,
    batchID: rawPostageBatch.batchID.toHex(),
  };
  const batchSummary: PostageBatchSummary = getBatchSummary(rawPostageBatch);

  const content: ResponseContent<PostageBatchCurated, PostageBatchSummary> = {
    raw: batch,
    summary: batchSummary,
  };

  return getResponseWithStructuredContent(content);
}
