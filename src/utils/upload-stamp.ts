import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import config from "../config";
import { errorHasStatus } from ".";
import { DEFAULT_GATEWAY_BATCH_ID, NOT_FOUND_STATUS } from "../constants";
import { Bee } from "@ethersphere/bee-js";

export const getUploadPostageBatchId = async (
  argsPostageBatchId: string | undefined,
  bee: Bee
): Promise<string> => {
  let postageBatchId = argsPostageBatchId;
  const autoAssignStamp = config.bee.autoAssignStamp;
  let maxRemainingSize = 0;

  if (!postageBatchId && !autoAssignStamp) {
    throw new McpError(
      ErrorCode.InvalidRequest,
      "No postageBatchId was provided. Please repeat the prompt and also specify the usable postage batch id."
    );
  } else if (!postageBatchId) {
    try {
      const rawPostageBatches = await bee.getPostageBatches();

      rawPostageBatches.forEach((batch) => {
        if (!batch.usable) {
          return;
        }

        const remainingSize = batch.remainingSize.toBytes();

        if (remainingSize > maxRemainingSize) {
          maxRemainingSize = remainingSize;
          postageBatchId = batch.batchID.toHex();
        }
      });
    } catch (error) {
      if (errorHasStatus(error, NOT_FOUND_STATUS)) {
        postageBatchId = DEFAULT_GATEWAY_BATCH_ID;
      } else {
        throw new McpError(
          ErrorCode.InvalidParams,
          "Retrieval of postage batches failed."
        );
      }
    }
  }

  if (!postageBatchId) {
    throw new McpError(
      ErrorCode.InvalidRequest,
      "There is no usable postage batch with capacity."
    );
  }
  return postageBatchId!;
};
