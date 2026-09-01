import { Bee } from "@ethersphere/bee-js";
import {
  ExtendedTask,
  TaskState,
  UpdateStatusFunction,
} from "../../tasks/models";
import { getResponseWithStructuredContent } from "../../utils";
import { TaskManager } from "../../tasks/task-manager";
import { UploadDeferredResult } from "../../models";
import { getUploadProgress } from "../../utils/polling";

export const updateUploadFileTaskStatus: UpdateStatusFunction = async (
  extendedTask: ExtendedTask,
  bee: Bee,
  taskManager: TaskManager
): Promise<void> => {
  try {
    if (!extendedTask?._meta?.tagId) {
      return;
    }

    const tagUid = Number(extendedTask._meta.tagId);
    const progress = await getUploadProgress(bee, tagUid);
    const reference = extendedTask?._meta?.reference;
    await taskManager.updateTaskStatus(
      extendedTask.task.taskId,
      TaskState.WORKING,
      `Processing: ${progress.processedPercentage}% (${progress.processed}/${progress.total} chunks)${reference ? ` for reference ${reference}` : ""}. You can also use query_upload_progress for tag id ${tagUid} to track progress.`
    );

    const now = new Date().toISOString();
    extendedTask.task.lastUpdatedAt = now;

    if (progress.isComplete && extendedTask?.result?.structuredContent) {
      const uploadDeferredResult = extendedTask.result
        .structuredContent as UploadDeferredResult;

      taskManager.setTaskResult(
        extendedTask.task.taskId,
        getResponseWithStructuredContent({
          reference: uploadDeferredResult.reference,
          url: uploadDeferredResult.url,
          message: "Upload completed successfully.",
        })
      );

      // Clean up tag (fire and forget)
      bee.deleteTag(tagUid).catch((error) => {
        console.error(`Failed to delete tag ${tagUid}:`, error);
      });
    }
  } catch (error) {
    await taskManager.updateTaskStatus(
      extendedTask.task.taskId,
      TaskState.FAILED,
      `Failed to update task ${extendedTask.task.taskId} status.`
    );
  }
};
