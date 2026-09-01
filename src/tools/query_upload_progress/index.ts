import { Bee } from "@ethersphere/bee-js";
import {
  getResponseWithStructuredContent,
  getToolErrorResponse,
  ToolResponse,
} from "../../utils";
import { QueryUploadProgressArgs } from "./models";
import { getUploadProgress } from "../../utils/polling";

export async function queryUploadProgress(
  args: QueryUploadProgressArgs,
  bee: Bee
): Promise<ToolResponse> {
  if (!args?.tagId) {
    return getToolErrorResponse("Missing required parameter: tagId.");
  }

  const tagUid = Number.parseInt(args.tagId, 10);
  if (Number.isNaN(tagUid)) {
    return getToolErrorResponse(
      "Invalid tagId format. Expected a numeric string."
    );
  }

  try {
    const progress = await getUploadProgress(bee, tagUid);

    if (progress.isComplete) {
      try {
        await bee.deleteTag(tagUid);
      } catch {
        // Non-fatal: if deletion fails we still return progress
      }
    }


    return getResponseWithStructuredContent({
      processedPercentage: progress.processedPercentage,
      message: progress.isComplete
        ? "Upload completed successfully."
        : `Upload progress: ${progress.processedPercentage}% processed`,
      startedAt: progress.startedAt,
      reference: progress.tagAddress,
    });
  } catch (error: any) {
    return getToolErrorResponse(
      `Failed to retrieve upload progress: ${error?.message ?? "Unknown error"}.`
    );
  }
}
