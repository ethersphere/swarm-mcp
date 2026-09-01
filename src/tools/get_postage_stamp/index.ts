/**
 * MCP Tool: get_postage_stamp
 * Show a specific postage stamp.
 */
import { Bee } from "@ethersphere/bee-js";
import {
  getBatchSummary,
  getResponseWithStructuredContent,
  getToolErrorResponse,
  ToolResponse,
} from "../../utils";
import { GetPostageStampArgs } from "./models";
import {
  PostageBatchCurated,
  PostageBatchSummary,
  ResponseContent,
} from "../../models";

export async function getPostageStamp(
  args: GetPostageStampArgs,
  bee: Bee
): Promise<ToolResponse> {
  const { postageBatchId } = args;

  if (!postageBatchId) {
    return getToolErrorResponse("Missing required parameter: postageBatchId.");
  }

  let rawPostageBatch;

  try {
    rawPostageBatch = await bee.getPostageBatch(postageBatchId);
  } catch (error) {
    return getToolErrorResponse("Retrieval of postage batch failed.");
  }

  const { utilization, ...filteredPostageBatch } = rawPostageBatch;

  const batch: PostageBatchCurated = {
    ...filteredPostageBatch,
    batchID: filteredPostageBatch.batchID.toHex(),
  };
  const batchSummary: PostageBatchSummary = getBatchSummary(batch);

  const content: ResponseContent<PostageBatchCurated, PostageBatchSummary> = {
    raw: batch,
    summary: batchSummary,
  };

  return getResponseWithStructuredContent(content);
}
