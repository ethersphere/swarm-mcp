import { CreateTaskResult } from "@modelcontextprotocol/sdk/types.js";
import { Bee, CollectionUploadOptions } from "@ethersphere/bee-js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { stat } from "fs/promises";
import {
  errorHasStatus,
  getErrorMessage,
  getResponseWithStructuredContent,
  getToolErrorResponse,
  ToolResponse,
} from "../../utils";
import { getUploadPostageBatchId } from "../../utils/upload-stamp";
import { UploadFolderArgs } from "./models";
import { BAD_REQUEST_STATUS } from "../../constants";

import config from "../../config";
import {
  collectFilesRelative,
  getTotalFilesSize,
  updateUploadFolderTaskStatus,
} from "./utils";
import { TaskManager } from "../../tasks/task-manager";
import { CreateTaskModel, TaskState } from "../../tasks/models";

export async function uploadFolder(
  args: UploadFolderArgs,
  bee: Bee,
  transport: any,
  taskManager?: TaskManager,
  createTaskModel?: CreateTaskModel
): Promise<ToolResponse | CreateTaskResult> {
  if (!args.folderPath) {
    return getToolErrorResponse("Missing required parameter: folderPath.");
  }

  if (
    args.redundancyLevel !== undefined &&
    (!Number.isInteger(args.redundancyLevel) ||
      args.redundancyLevel < 0 ||
      args.redundancyLevel > 4)
  ) {
    return getToolErrorResponse(
      "Invalid redundancyLevel. Must be an integer between 0 and 4 (0=OFF, 1=MEDIUM, 2=STRONG, 3=INSANE, 4=PARANOID)."
    );
  }

  // Check if in stdio mode for folder path uploads
  if (!(transport instanceof StdioServerTransport)) {
    return getToolErrorResponse(
      "Folder path uploads are only supported in stdio mode."
    );
  }

  // Check if folder exists
  const stats = await stat(args.folderPath);
  if (!stats.isDirectory()) {
    return getToolErrorResponse(`Path is not a directory: ${args.folderPath}.`);
  }

  const { postageBatchId, error } = await getUploadPostageBatchId(
    args.postageBatchId,
    bee
  );

  if (error !== null) {
    return getToolErrorResponse(error);
  } else if (postageBatchId === null) {
    return getToolErrorResponse("No postage batch id.");
  }

  const redundancyLevel = args.redundancyLevel;
  const options: CollectionUploadOptions = {};

  if (redundancyLevel) {
    options.redundancyLevel = redundancyLevel;
  }

  // Single-file collections return raw manifest bytes from the Bee node unless an
  // index document is set, so auto-detect and set it to avoid garbled downloads.
  const allFiles = await collectFilesRelative(args.folderPath);
  if (allFiles.length === 1) {
    options.indexDocument = allFiles[0];
  }

  // Defer by total size, matching upload_file. Small folders upload
  // synchronously so the caller gets the manifest reference straight away;
  // unlike a single file, a folder root cannot be computed locally, so
  // deferring is the only case where the reference is unavailable up front.
  const sizeBytes = await getTotalFilesSize(args.folderPath, allFiles);
  let deferred =
    sizeBytes > config.bee.deferredUploadSizeThreshold * 1024 * 1024;
  options.deferred = deferred;

  let message = "Folder successfully uploaded to Swarm";

  let tagId: string | undefined = undefined;
  if (deferred) {
    try {
      const tag = await bee.createTag();
      tagId = tag.uid.toString();
      options.tag = tag.uid;
      message =
        "Folder upload started in deferred mode. Use query_upload_progress to track progress.";
    } catch (error) {
      // Without a tag there is nothing to poll, so fall back to a synchronous
      // upload and keep `deferred` in step with the options we send.
      deferred = false;
      options.deferred = false;
    }
  }

  const isRunningAsTask = taskManager && createTaskModel;

  if (isRunningAsTask) {
    const task = await taskManager.createTask(
      createTaskModel,
      updateUploadFolderTaskStatus,
      null,
      {
        tagId: tagId ?? null,
      }
    );

    bee
      .uploadFilesFromDirectory(postageBatchId, args.folderPath, options)
      .then(async (result) => {
        const responseWithStructuredContent = getResponseWithStructuredContent({
          reference: result.reference.toString(),
          message: "Folder upload complete.",
          tagId,
        });

        taskManager.addExtendedTaskMetadata(
          task.taskId,
          "reference",
          result.reference.toString()
        );

        await taskManager.setTaskResult(
          task.taskId,
          responseWithStructuredContent,
          deferred
        );
      })
      .catch((error) => {
        let errorMessage = "Unable to upload folder.";
        if (errorHasStatus(error, BAD_REQUEST_STATUS)) {
          errorMessage = getErrorMessage(error);
        }

        taskManager.updateTaskStatus(
          task.taskId,
          TaskState.FAILED,
          errorMessage
        );
      });

    return {
      task,
    };
  }

  // Fire-and-forget path when a tag was created (folders always request
  // deferred). Return immediately with the tagId so the MCP client doesn't
  // time out; progress + final reference are discoverable via
  // query_upload_progress.
  if (deferred && tagId) {
    bee
      .uploadFilesFromDirectory(postageBatchId, args.folderPath, options)
      .catch(() => {
        /* failure surfaces via query_upload_progress on the tag */
      });
    return getResponseWithStructuredContent({
      tagId,
      message:
        "Folder upload started in the background. Poll query_upload_progress with this tagId to check completion; the final reference is available on the tag once processed=true.",
    });
  }

  let result;

  try {
    result = await bee.uploadFilesFromDirectory(
      postageBatchId,
      args.folderPath,
      options
    );
  } catch (error) {
    const detail =
      errorHasStatus(error, BAD_REQUEST_STATUS) && getErrorMessage(error)
        ? getErrorMessage(error)
        : error instanceof Error
          ? error.message
          : String(error);
    return getToolErrorResponse(`Unable to upload folder: ${detail}`);
  }

  return getResponseWithStructuredContent({
    reference: result.reference.toString(),
    message,
    tagId,
  });
}
