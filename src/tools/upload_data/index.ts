/**
 * MCP Tool: upload_data
 * Uploads text data to Swarm.
 */
import { Bee } from "@ethersphere/bee-js";
import config from "../../config";
import {
  errorHasStatus,
  getErrorMessage,
  getResponseWithStructuredContent,
  getToolErrorResponse,
  ToolResponse,
} from "../../utils";
import { getUploadPostageBatchId } from "../../utils/upload-stamp";
import { UploadDataArgs } from "./models";
import { BAD_REQUEST_STATUS } from "../../constants";

export async function uploadData(
  args: UploadDataArgs,
  bee: Bee
): Promise<ToolResponse> {
  if (!args.data) {
    return getToolErrorResponse("Missing required parameter: data.");
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

  const binaryData = Buffer.from(args.data);

  const redundancyLevel = args.redundancyLevel;
  const options = redundancyLevel ? { redundancyLevel } : undefined;

  let result;

  try {
    result = await bee.uploadData(postageBatchId, binaryData, options);
  } catch (error) {
    const errorMsg = errorHasStatus(error, BAD_REQUEST_STATUS)
      ? getErrorMessage(error)
      : "Unable to upload data.";

    return getToolErrorResponse(errorMsg);
  }

  return getResponseWithStructuredContent({
    reference: result.reference.toString(),
    url: config.bee.endpoint + "/bytes/" + result.reference.toString(),
    message: "Data successfully uploaded to Swarm",
  });
}
