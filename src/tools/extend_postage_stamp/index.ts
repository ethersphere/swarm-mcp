/**
 * MCP Tool: extend_postage_stamp
 * Increase the duration and size of a postage stamp.
 */
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { BatchId, Bee, Duration, Size } from "@ethersphere/bee-js";
import {
  errorHasStatus,
  getErrorMessage,
  getResponseWithStructuredContent,
  runWithTimeout,
  ToolResponse,
} from "../../utils";
import { ExtendPostageStampArgs } from "./models";
import {
  BAD_REQUEST_STATUS,
  CALL_TIMEOUT,
  EXTEND_POSTAGE_TIMEOUT_MESSAGE,
} from "../../constants";

export async function extendPostageStamp(
  args: ExtendPostageStampArgs,
  bee: Bee
): Promise<ToolResponse> {
  const { postageBatchId, duration, size } = args;

  if (!postageBatchId) {
    throw new McpError(
      ErrorCode.InvalidParams,
      "Missing required parameter: postageBatchId"
    );
  } else if (!duration && !size) {
    throw new McpError(
      ErrorCode.InvalidParams,
      "You need at least one parameter from duration and size."
    );
  }

  const extendSize = !!size ? Size.fromMegabytes(size) : Size.fromBytes(1);
  let extendDuration = Duration.ZERO;

  try {
    if (duration) {
      extendDuration = Duration.parseFromString(duration);
    }
  } catch (makeDateError) {
    throw new McpError(ErrorCode.InvalidParams, "Invalid parameter: duration");
  }

  let extendStorageResponse;

  try {
    const extendStoragePromise = bee.extendStorage(
      postageBatchId,
      extendSize,
      extendDuration
    );

    const [response, hasTimedOut] = await runWithTimeout(
      extendStoragePromise,
      CALL_TIMEOUT
    );

    if (hasTimedOut) {
      return {
        content: [
          {
            type: "text",
            text: EXTEND_POSTAGE_TIMEOUT_MESSAGE,
          },
        ],
      };
    }

    extendStorageResponse = response as BatchId;
  } catch (error) {
    if (errorHasStatus(error, BAD_REQUEST_STATUS)) {
      throw new McpError(ErrorCode.InvalidRequest, getErrorMessage(error));
    } else {
      throw new McpError(ErrorCode.InvalidParams, "Extend failed.");
    }
  }

  return getResponseWithStructuredContent({
    postageBatchId: extendStorageResponse.toHex(),
  });
}
