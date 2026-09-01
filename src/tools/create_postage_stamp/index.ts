/**
 * MCP Tool: create_postage_stamp
 * Buy postage stamp based on size and duration.
 */
import { CreateTaskResult } from "@modelcontextprotocol/sdk/types.js";
import { BatchId, Bee, Duration, Size } from "@ethersphere/bee-js";
import {
  errorHasStatus,
  getErrorMessage,
  getResponseWithStructuredContent,
  getToolErrorResponse,
  runWithTimeout,
  ToolResponse,
} from "../../utils";
import { CreatePostageStampArgs } from "./models";
import {
  BAD_REQUEST_STATUS,
  CALL_TIMEOUT,
  POSTAGE_CREATE_TIMEOUT_MESSAGE,
} from "../../constants";
import { TaskManager } from "../../tasks/task-manager";
import { CreateTaskModel, TaskState } from "../../tasks/models";

export async function createPostageStamp(
  args: CreatePostageStampArgs,
  bee: Bee,
  taskManager?: TaskManager,
  createTaskModel?: CreateTaskModel
): Promise<ToolResponse | CreateTaskResult> {
  const { size, duration, label } = args;

  if (!size) {
    return getToolErrorResponse("Missing required parameter: size.");
  } else if (!duration) {
    return getToolErrorResponse("Missing required parameter: duration.");
  }

  let parsedSize, parsedDuration;

  try {
    parsedSize = Size.parseFromString(size);
  } catch (error) {
    return getToolErrorResponse("Invalid parameter: size.");
  }

  try {
    parsedDuration = Duration.parseFromString(duration);
  } catch (error) {
    return getToolErrorResponse("Invalid parameter: duration.");
  }

  const isRunningAsTask = taskManager && createTaskModel;
  if (isRunningAsTask) {
    const task = await taskManager.createTask(createTaskModel, null, null);

    bee
      .buyStorage(parsedSize, parsedDuration, {
        label,
      })
      .then(async (result) => {
        const buyStorageResponse = result as BatchId;
        const postageBatchReference = buyStorageResponse.toHex();
        const responseWithStructuredContent = getResponseWithStructuredContent({
          postageBatchId: postageBatchReference,
          message: `Postage batch creation succeeded. You can request postage batch ${postageBatchReference} to find out details about it.`,
        });

        await taskManager!.setTaskResult(
          task.taskId,
          responseWithStructuredContent
        );
      })
      .catch((error) => {
        let errorMessage = "Unable to buy storage.";
        if (errorHasStatus(error, BAD_REQUEST_STATUS)) {
          errorMessage = `Unable to buy storage: ${getErrorMessage(error)}`;
        }

        taskManager!.updateTaskStatus(
          task.taskId,
          TaskState.FAILED,
          errorMessage
        );
      });

    return {
      task,
    };
  }

  let buyStorageResponse: BatchId;

  try {
    const buyStoragePromise = bee.buyStorage(parsedSize, parsedDuration, {
      label,
    });
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
    const errorMsg = errorHasStatus(error, BAD_REQUEST_STATUS)
      ? `Unable to buy storage: ${getErrorMessage(error)}`
      : "Unable to buy storage.";

    return getToolErrorResponse(errorMsg);
  }

  return getResponseWithStructuredContent({
    postageBatchId: buyStorageResponse.toHex(),
    message: "Postage batch creation succeeded.",
  });
}
