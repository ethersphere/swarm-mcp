/**
 * MCP Tool: create_postage_stamp
 * Buy postage stamp based on size and duration.
 */
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { BatchId, Bee, Duration, Size } from "@ethersphere/bee-js";
import {
  errorHasStatus,
  getErrorMessage,
  runWithTimeout,
  ToolResponse,
} from "../../utils";
import { CreatePostageStampArgs } from "./models";
import {
  BAD_REQUEST_STATUS,
  CALL_TIMEOUT,
  POSTAGE_CREATE_TIMEOUT_MESSAGE,
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


  let buyStorageResponse: BatchId;

  try {
    const buyStoragePromise = bee.buyStorage(
      Size.fromMegabytes(size),
      Duration.parseFromString(duration),
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
    if (errorHasStatus(error, BAD_REQUEST_STATUS)) {
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
