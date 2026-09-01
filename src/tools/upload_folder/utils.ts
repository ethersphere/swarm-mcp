import { Bee } from "@ethersphere/bee-js";
import { readdir, stat } from "fs/promises";
import path from "path";
import {
  ExtendedTask,
  TaskState,
  UpdateStatusFunction,
} from "../../tasks/models";
import { getResponseWithStructuredContent } from "../../utils";
import { TaskManager } from "../../tasks/task-manager";
import { UploadDeferredResult } from "../../models";
import { getUploadProgress } from "../../utils/polling";

export const updateUploadFolderTaskStatus: UpdateStatusFunction = async (
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
          message: "Folder upload completed successfully.",
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


/**
 * Sums the byte size of the given files (paths relative to `dir`). Used to
 * decide whether a folder upload is small enough to run synchronously, so
 * only sizes are read here -- never the file contents.
 */
export const getTotalFilesSize = async (
  dir: string,
  relativeFiles: string[]
): Promise<number> => {
  const sizes = await Promise.all(
    relativeFiles.map(async (relative) => {
      try {
        const stats = await stat(path.join(dir, relative));
        return stats.size;
      } catch {
        // Unreadable entry: treat as 0 here and let the upload itself report it.
        return 0;
      }
    })
  );

  return sizes.reduce((total, size) => total + size, 0);
};

export const collectFilesRelative = async (
  dir: string,
  relative = ""
): Promise<string[]> => {
  const entries = await readdir(path.join(dir, relative), {
    withFileTypes: true,
  });
  const files: string[] = [];
  for (const entry of entries) {
    const entryRelative = relative ? `${relative}/${entry.name}` : entry.name;
    if (entry.isFile()) {
      files.push(entryRelative);
    } else if (entry.isDirectory()) {
      files.push(...(await collectFilesRelative(dir, entryRelative)));
    }
  }
  return files;
}
