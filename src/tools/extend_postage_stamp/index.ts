/**
 * MCP Tool: extend_postage_stamp
 * Increase the duration and size of a postage stamp.
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
import { ExtendPostageStampArgs } from "./models";
import {
  BAD_REQUEST_STATUS,
  CALL_TIMEOUT,
  EXTEND_POSTAGE_TIMEOUT_MESSAGE,
} from "../../constants";
import { TaskManager } from "../../tasks/task-manager";
import { CreateTaskModel, TaskState } from "../../tasks/models";

export async function extendPostageStamp(
  args: ExtendPostageStampArgs,
  bee: Bee,
  taskManager?: TaskManager,
  createTaskModel?: CreateTaskModel
): Promise<ToolResponse | CreateTaskResult> {
  const { postageBatchId, duration, size } = args;

  if (!postageBatchId) {
    return getToolErrorResponse("Missing required parameter: postageBatchId.");
  } else if (!duration && !size) {
    return getToolErrorResponse(
      "You need at least one parameter from duration and size."
    );
  }

  let extendSize = Size.fromBytes(1);
  let extendDuration = Duration.ZERO;

  try {
    if (size) {
      extendSize = Size.parseFromString(size);
    }
  } catch (error) {
    return getToolErrorResponse("Invalid parameter: size.");
  }

  try {
    if (duration) {
      extendDuration = Duration.parseFromString(duration);
    }
  } catch (error) {
    return getToolErrorResponse("Invalid parameter: duration.");
  }

  const isRunningAsTask = taskManager && createTaskModel;

  if (isRunningAsTask) {
    const task = await taskManager.createTask(createTaskModel, null, null);

    bee
      .extendStorage(postageBatchId, extendSize, extendDuration)
      .then(async (result) => {
        const extendStorageResponse = result as BatchId;
        const responseWithStructuredContent = getResponseWithStructuredContent({
          postageBatchId: extendStorageResponse.toHex(),
          message: "Postage batch extension succeeded.",
        });

        await taskManager!.setTaskResult(
          task.taskId,
          responseWithStructuredContent
        );
      })
      .catch((error) => {
        let errorMessage = "Extend failed.";
        if (
          errorHasStatus(error, BAD_REQUEST_STATUS) ||
          errorHasStatus(error, 402)
        ) {
          errorMessage = `Extend failed: ${getErrorMessage(error)}`;
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
      return getResponseWithStructuredContent({
        postageBatchId: postageBatchId,
        message: EXTEND_POSTAGE_TIMEOUT_MESSAGE,
      });
    }

    extendStorageResponse = response as BatchId;
  } catch (error) {
    let errorMsg = "Extend failed.";
    if (
      errorHasStatus(error, BAD_REQUEST_STATUS) ||
      errorHasStatus(error, 402)
    ) {
      errorMsg = `Extend failed: ${getErrorMessage(error)}`;
    } else if (extendDuration === Duration.ZERO) {
      // A likely cause of the extension failing when extension duration is 0
      // is an extension size smaller than the current one.
      errorMsg =
        "Extend failed. Please make sure the passed in size is larger than current one.";
    }

    return getToolErrorResponse(errorMsg);
  }

  return getResponseWithStructuredContent({
    postageBatchId: extendStorageResponse.toHex(),
    message: "Postage batch extension succeeded.",
  });
}
