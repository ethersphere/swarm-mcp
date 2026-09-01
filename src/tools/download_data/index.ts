/**
 * MCP Tool: download_data
 * Downloads immutable data from a Swarm content address hash.
 */
import { Bee } from "@ethersphere/bee-js";
import {
  getResponseWithStructuredContent,
  getToolErrorResponse,
  ToolResponse,
} from "../../utils";
import { DownloadDataArgs } from "./models";

export async function downloadData(
  args: DownloadDataArgs,
  bee: Bee
): Promise<ToolResponse> {
  const { reference } = args;

  if (!reference) {
    return getToolErrorResponse("Missing required parameter: reference.");
  }

  const isRefNotSwarmHash = reference.length !== 64 && reference.length !== 66;

  if (isRefNotSwarmHash) {
    return getToolErrorResponse(
      "Invalid Swarm content address hash value for reference."
    );
  }

  const data = await bee.downloadData(reference);
  const textData = data.toUtf8();

  return getResponseWithStructuredContent({
    textData,
  });
}
