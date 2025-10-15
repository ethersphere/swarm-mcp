/**
 * MCP Tool: list_postage_stamps
 * List the available postage stamps.
 */
import { Bee } from "@ethersphere/bee-js";
import {
  errorHasStatus,
  getBatchSummary,
  getResponseWithStructuredContent,
  ToolResponse,
} from "../../utils";
import {
  PostageBatchCurated,
  PostageBatchSummary,
  ResponseContent,
} from "../../models";
import { ListPostageStampsArgs } from "./models";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { GATEWAY_STAMP_ERROR_MESSAGE, NOT_FOUND_STATUS } from "../../constants";

export async function listPostageStamps(
  args: ListPostageStampsArgs,
  bee: Bee
): Promise<ToolResponse> {
  const { leastUsed, limit, minUsage, maxUsage } = args;

  let rawPostageBatches;

  try {
    rawPostageBatches = await bee.getPostageBatches();
  } catch (error) {
    if (errorHasStatus(error, NOT_FOUND_STATUS)) {
      throw new McpError(ErrorCode.MethodNotFound, GATEWAY_STAMP_ERROR_MESSAGE);
    } else {
      throw new McpError(
        ErrorCode.InvalidParams,
        "Retrieval of postage batches failed."
      );
    }
  }

  const batches: PostageBatchCurated[] = rawPostageBatches.map((batch) => ({
    ...batch,
    batchID: batch.batchID.toHex(),
  }));
  let filteredPostageBatches = batches.filter((batch) => {
    if (!batch.usable) {
      return false;
    }

    const usagePercentage = batch.usage * 100;

    if (minUsage !== undefined && usagePercentage < minUsage) {
      return false;
    }

    if (maxUsage !== undefined && usagePercentage > maxUsage) {
      return false;
    }

    return true;
  });

  if (Boolean(leastUsed) && filteredPostageBatches.length) {
    filteredPostageBatches = filteredPostageBatches.sort(
      (batch1, batch2) => batch1.usage - batch2.usage
    );
  }

  if (limit !== undefined && limit < filteredPostageBatches.length) {
    filteredPostageBatches = filteredPostageBatches.slice(0, limit);
  }

  const computedPostageBatches: PostageBatchSummary[] =
    filteredPostageBatches.map((batch) => getBatchSummary(batch));

  const content: ResponseContent<PostageBatchCurated[], PostageBatchSummary[]> =
    {
      raw: filteredPostageBatches,
      summary: computedPostageBatches,
    };

  return getResponseWithStructuredContent(content);
}
