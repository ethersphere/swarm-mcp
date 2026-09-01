import { existsSync, statSync } from "fs";
import { SwarmToolsSchema } from "../schemas";
import { CreatePostageStampArgs } from "../tools/create_postage_stamp/models";
import { DownloadDataArgs } from "../tools/download_data/models";
import { DownloadFilesArgs } from "../tools/download_files/models";
import { ExtendPostageStampArgs } from "../tools/extend_postage_stamp/models";
import { GetPostageStampArgs } from "../tools/get_postage_stamp/models";
import { ListPostageStampsArgs } from "../tools/list_postage_stamps/models";
import { QueryUploadProgressArgs } from "../tools/query_upload_progress/models";
import { ReadFeedArgs } from "../tools/read_feed/models";
import { UpdateFeedArgs } from "../tools/update_feed/models";
import { UploadDataArgs } from "../tools/upload_data/models";
import { UploadFileArgs } from "../tools/upload_file/models";
import { UploadFolderArgs } from "../tools/upload_folder/models";

export const getSwarmPromptsSchema = () => {
  return {
    prompts: SwarmToolsSchema.map(
      ({ name, title, description, inputSchema }) => {
        return {
          name: `${name}_prompt`,
          title,
          description,
          arguments: Object.entries(inputSchema.properties).map(
            ([key, value]) => {
              return {
                name: key,
                description: value.description,
                required: inputSchema.required?.includes(key),
              };
            }
          ),
        };
      }
    ),
  };
};

export const getUploadDataPrompt = (args: UploadDataArgs) => {
  let prompt = `Upload the following data to Swarm: ${args.data}`;

  if (args.postageBatchId) {
    prompt += `, using postage batch: ${args.postageBatchId}`;
  }

  if (args.redundancyLevel) {
    prompt += `, using redundancy level: ${args.redundancyLevel}`;
  }

  return prompt;
};

export const getDownloadDataPrompt = (args: DownloadDataArgs) => {
  const prompt = `Download data from Swarm using reference: ${args.reference}`;

  return prompt;
};

export const getUpdateFeedPrompt = (args: UpdateFeedArgs) => {
  let prompt = `Update the feed of topic: ${args.memoryTopic} with data: ${args.data}`;

  if (args.postageBatchId) {
    prompt += ` using postage batch: ${args.postageBatchId}`;
  }

  return prompt;
};

export const getReadFeedPrompt = (args: ReadFeedArgs) => {
  let prompt = `Read the feed of topic: ${args.memoryTopic}`;

  if (args.owner) {
    prompt += ` using owner: ${args.owner}`;
  }

  return prompt;
};

export const getDownloadFilesPrompt = (args: DownloadFilesArgs) => {
  let prompt = `Download files from Swarm using reference: ${args.reference}`;

  if (args.filePath) {
    prompt += ` to path: ${args.filePath}`;
  }

  return prompt;
};

export const getUploadFilePrompt = (args: UploadFileArgs) => {
  let prompt = "";

  let isPath = false;
  try {
    isPath = existsSync(args.data) && statSync(args.data).isFile();
  } catch {
    isPath = false;
  }

  if (isPath) {
    prompt = `Upload to Swarm the file at path: ${args.data}`;
  } else {
    prompt = `Upload to Swarm a file with the content (treat it as file content, not file path): ${args.data}`;
  }

  if (args.postageBatchId) {
    prompt += ` using postage batch: ${args.postageBatchId}`;
  }

  if (args.redundancyLevel) {
    prompt += ` with redundancy level: ${args.redundancyLevel}`;
  }

  return prompt;
};

export const getUploadFolderPrompt = (args: UploadFolderArgs) => {
  let prompt = `Upload to Swarm the folder at path: ${args.folderPath}`;

  if (args.postageBatchId) {
    prompt += ` using postage batch: ${args.postageBatchId}`;
  }

  if (args.redundancyLevel) {
    prompt += ` with redundancy level: ${args.redundancyLevel}`;
  }

  return prompt;
};

export const getQueryUploadProgressPrompt = (args: QueryUploadProgressArgs) => {
  const prompt = `Query the upload progress of tag: ${args.tagId}`;

  return prompt;
};

export const getCreatePostageStampPrompt = (args: CreatePostageStampArgs) => {
  let prompt = `Create a new postage stamp batch with size: ${args.size} and duration: ${args.duration}`;

  if (args.label) {
    prompt += ` with label: ${args.label}`;
  }

  return prompt;
};

export const getExtendPostageStampPrompt = (args: ExtendPostageStampArgs) => {
  let prompt = `Extend the postage stamp batch ${args.postageBatchId}`;

  if (args.duration) {
    prompt += ` by ${args.duration}`;
  }

  if (args.size) {
    prompt += ` to ${args.size}`;
  }

  return prompt;
};

export const getGetPostageStampPrompt = (args: GetPostageStampArgs) => {
  const prompt = `Get the postage stamp batch with id: ${args.postageBatchId}`;

  return prompt;
};

export const getListPostageStampsPrompt = (args: ListPostageStampsArgs) => {
  let prompt = `List the postage stamp batches`;

  if (args.leastUsed) {
    prompt += ` sorted by least used`;
  }

  if (args.limit) {
    prompt += ` with limit: ${args.limit}`;
  }

  if (args.minUsage) {
    prompt += ` with minimum usage: ${args.minUsage}`;
  }

  if (args.maxUsage) {
    prompt += ` with maximum usage: ${args.maxUsage}`;
  }

  return prompt;
};
