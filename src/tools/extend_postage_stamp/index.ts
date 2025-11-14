/**
 * MCP Tool: extend_postage_stamp
 * Increase the duration and size of a postage stamp.
 */
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { Bee, Duration, Size } from "@ethersphere/bee-js";
import {
  errorHasStatus,
  getErrorMessage,
  getResponseWithStructuredContent,
  makeDate,
  ToolResponse,
} from "../../utils";
import { ExtendPostageStampArgs } from "./models";
import {
  BAD_REQUEST_STATUS,
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
      extendDuration = Duration.fromMilliseconds(makeDate(duration));
    }
  } catch (makeDateError) {
    throw new McpError(ErrorCode.InvalidParams, "Invalid parameter: duration");
  }

  let extendStorageResponse;

  try {
    extendStorageResponse = await bee.extendStorage(
      postageBatchId,
      extendSize,
      extendDuration
    );
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
