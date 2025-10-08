/**
 * MCP Tool: create_postage_stamp
 * Buy postage stamp based on size and duration.
 */
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { BatchId, Bee, Duration, Size } from "@ethersphere/bee-js";
import {
  errorHasStatus,
  getErrorMessage,
  getResponseWithStructuredContent,
  makeDate,
  runWithTimeout,
  ToolResponse,
} from "../../utils";
import { CreatePostageStampArgs } from "./models";
import {
  BAD_REQUEST_STATUS,
  CALL_TIMEOUT,
  POSTAGE_CREATE_TIMEOUT_MESSAGE,
  GATEWAY_STAMP_ERROR_MESSAGE,
  NOT_FOUND_STATUS,
} from "../../constants";

export async function createPostageStamp(
  args: CreatePostageStampArgs,
  bee: Bee
): Promise<ToolResponse> {
  const { size, duration, label } = args;

  if (!size) {
    throw new McpError(
      ErrorCode.InvalidParams,
      "Missing required parameter: size."
    );
  } else if (!duration) {
    throw new McpError(
      ErrorCode.InvalidParams,
      "Missing required parameter: duration."
    );
  }

  let durationMs;

  try {
    durationMs = makeDate(duration);
  } catch (makeDateError) {
    throw new McpError(ErrorCode.InvalidParams, "Invalid parameter: duration");
  }

  let buyStorageResponse: BatchId;

  try {
    const buyStoragePromise = bee.buyStorage(
      Size.fromMegabytes(size),
      Duration.fromMilliseconds(durationMs),
      {
        label,
      }
    );
    const [response, hasTimedOut] = await runWithTimeout(
      buyStoragePromise,
      CALL_TIMEOUT
    );

    if (hasTimedOut) {
      return {
        content: [
          {
            type: "text",
            text: POSTAGE_CREATE_TIMEOUT_MESSAGE,
          },
        ],
      };
    }

    buyStorageResponse = response as BatchId;
  } catch (error) {
    if (errorHasStatus(error, NOT_FOUND_STATUS)) {
      throw new McpError(ErrorCode.MethodNotFound, GATEWAY_STAMP_ERROR_MESSAGE);
    } else if (errorHasStatus(error, BAD_REQUEST_STATUS)) {
      throw new McpError(ErrorCode.InvalidRequest, getErrorMessage(error));
    } else {
      throw new McpError(ErrorCode.InvalidParams, "Unable to buy storage.");
    }
  }

  return {
    content: [
      {
        type: "text",
        text: `Postage batch ID: ${buyStorageResponse.toHex()}`,
      },
    ],
  };
}
