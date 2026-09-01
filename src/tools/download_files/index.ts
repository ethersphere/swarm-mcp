/**
 * MCP Tool: download_files
 * Download folder, files from a Swarm reference
 */
import { Bee, MantarayNode } from "@ethersphere/bee-js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import fs from "fs";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import {
  errorHasStatus,
  getErrorMessage,
  getResponseWithStructuredContent,
  getToolErrorResponse,
  ToolResponse,
} from "../../utils";
import { DownloadFilesArgs } from "./models";
import { TaskManager } from "../../tasks/task-manager";
import { CreateTaskModel, TaskState } from "../../tasks/models";
import { BAD_REQUEST_STATUS } from "../../constants";

export async function downloadFiles(
  args: DownloadFilesArgs,
  bee: Bee,
  transport: any,
  taskManager?: TaskManager,
  createTaskModel?: CreateTaskModel
): Promise<ToolResponse> {
  if (!args.reference) {
    return getToolErrorResponse("Missing required parameter: reference.");
  }
  if (args.filePath && !(transport instanceof StdioServerTransport)) {
    return getToolErrorResponse(
      "Saving to file path is only supported in stdio mode."
    );
  }

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

  if (!isManifest) {
    return getToolErrorResponse(
      "Try download_data tool instead since the given reference is not a manifest."
    );
  }

  const isRunningAsTask = taskManager && createTaskModel;

  if (isRunningAsTask) {
    const task = await taskManager.createTask(createTaskModel, null, null);

    downloadFilesHelper(args, bee, node!)
      .then(async (result) => {
        await taskManager.setTaskResult(task.taskId, result);
      })
      .catch((error) => {
        let errorMessage = "Unable to download files.";
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

  return await downloadFilesHelper(args, bee, node!);
}

const downloadFilesHelper = async (
  args: DownloadFilesArgs,
  bee: Bee,
  node: MantarayNode
) => {
  const destinationFolder = path.resolve(args.filePath ?? process.cwd());

  if (!fs.existsSync(destinationFolder)) {
    await mkdir(destinationFolder, { recursive: true });
  }

  const nodes = node!.collect();

  if (nodes.length === 1) {
    const single = nodes[0];
    const data = await bee.downloadData(single.targetAddress);
    await writeFile(
      path.join(destinationFolder, path.basename(single.fullPathString)),
      data.toUint8Array()
    );
  } else {
    for (const child of nodes) {
      const parsedPath = path.parse(child.fullPathString);
      const nodeDestFolder = path.join(destinationFolder, parsedPath.dir);
      if (!fs.existsSync(nodeDestFolder)) {
        await mkdir(nodeDestFolder, { recursive: true });
      }

      const data = await bee.downloadData(child.targetAddress);
      await writeFile(
        path.join(destinationFolder, child.fullPathString),
        data.toUint8Array()
      );
    }
  }

  return getResponseWithStructuredContent({
    reference: args.reference,
    manifestNodeCount: nodes.length,
    savedTo: destinationFolder,
    message:
      nodes.length === 1
        ? `File successfully downloaded to ${destinationFolder}`
        : `Manifest content (${nodes.length} files) successfully downloaded to ${destinationFolder}`,
  });
};
