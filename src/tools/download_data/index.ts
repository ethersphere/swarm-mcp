/**
 * MCP Tool: download_data
 * Downloads immutable data from a Swarm content address hash.
 */
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { Bee } from "@ethersphere/bee-js";
import { getResponseWithStructuredContent, ToolResponse } from "../../utils";
import { DownloadDataArgs } from "./models";

export async function downloadData(
  args: DownloadDataArgs,
  bee: Bee
): Promise<ToolResponse> {
  const { reference } = args;

  if (!reference) {
    throw new McpError(
      ErrorCode.InvalidParams,
      "Missing required parameter: reference"
    );
  }

  const isRefNotSwarmHash = reference.length !== 64 && reference.length !== 66;

  if (isRefNotSwarmHash) {
    throw new McpError(
      ErrorCode.InvalidParams,
      "Invalid Swarm content address hash value for reference."
    );
  }

  const data = await bee.downloadData(reference);
  const textData = data.toUtf8();

  return getResponseWithStructuredContent({
    textData,
  });
}
