/**
 * MCP Tool: download_files
 * Download folder, files from a Swarm reference
 */
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { Bee, MantarayNode } from "@ethersphere/bee-js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import fs from "fs";
import { promisify } from "util";
import path from "path";
import { ToolResponse } from "../../utils";
import { DownloadFilesArgs } from "./models";

export async function downloadFiles(
  args: DownloadFilesArgs,
  bee: Bee,
  transport: any
): Promise<ToolResponse> {
  if (!args.reference) {
    throw new McpError(
      ErrorCode.InvalidParams,
      "Missing required parameter: reference"
    );
  }
  if (args.filePath && !(transport instanceof StdioServerTransport)) {
    throw new McpError(
      ErrorCode.InvalidParams,
      "Saving to file path is only supported in stdio mode"
    );
  }

  console.error(
    `[API] Downloading folder from Swarm with reference: ${args.reference}`
  );

  // Check if the reference is a manifest
  let isManifest = false;
  let node: MantarayNode;

  try {
    node = await MantarayNode.unmarshal(bee, args.reference);
    await node.loadRecursively(bee);
    isManifest = true;
  } catch (error) {
    // ignore
  }

  if (isManifest) {
    if (args.filePath) {
      const destinationFolder = args.filePath;

      if (!fs.existsSync(destinationFolder)) {
        await promisify(fs.mkdir)(destinationFolder, { recursive: true });
      }

      const nodes = node!.collect();

      if (nodes.length === 1) {
        const node = nodes[0];
        const data = await bee.downloadData(node.targetAddress);
        await promisify(fs.writeFile)(
          path.join(
            destinationFolder,
            node.fullPathString.split("\\").slice(-1)[0]
          ),
          data.toUint8Array()
        );
      } else {
        // Download each node
        for (const node of nodes) {
          const parsedPath = path.parse(node.fullPathString);
          const nodeDestFolder = path.join(destinationFolder, parsedPath.dir);
          // Create subdirectories if necessary
          if (!fs.existsSync(nodeDestFolder)) {
            await promisify(fs.mkdir)(nodeDestFolder, { recursive: true });
          }

          const data = await bee.downloadData(node.targetAddress);
          await promisify(fs.writeFile)(
            path.join(destinationFolder, node.fullPathString),
            data.toUint8Array()
          );
        }
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                reference: args.reference,
                manifestNodeCount: nodes.length,
                savedTo: destinationFolder,
                message: `Manifest content (${nodes.length} files) successfully downloaded to ${destinationFolder}`,
              },
              null,
              2
            ),
          },
        ],
      };
    } else {
      // regular file
      const nodes = node!.collect();
      const filesList = nodes.map((node) => ({
        path: node.fullPathString || "/",
        targetAddress: Array.from(node.targetAddress)
          .map((e) => e.toString(16).padStart(2, "0"))
          .join(""),
        metadata: node.metadata,
      }));

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                reference: args.reference,
                type: "manifest",
                files: filesList,
                message:
                  "This is a manifest with multiple files. Provide a filePath to download all files or download individual files using their specific references.",
              },
              null,
              2
            ),
          },
        ],
      };
    }
  } else {
    throw new McpError(
      ErrorCode.InvalidRequest,
      "try download_data tool instead since the given reference is not a manifest"
    );
  }
}
