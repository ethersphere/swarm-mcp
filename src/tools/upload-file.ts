/**
 * MCP Tool: upload_file
 * Upload a file to Swarm
 */
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { Bee, FileUploadOptions } from '@ethersphere/bee-js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import fs from 'fs';
import { promisify } from 'util';
import config from '../config';
import { ToolResponse } from '../utils';

export interface UploadFileArgs {
  data: string;
  isPath?: boolean;
  redundancyLevel?: number;
}

export async function uploadFile(args: UploadFileArgs, bee: Bee, transport: any): Promise<ToolResponse> {
  if (!args.data) {
    throw new McpError(
      ErrorCode.InvalidParams,
      'Missing required parameter: data'
    );
  }

  let binaryData: Buffer;
  let name: string | undefined;
  
  if (args.isPath) {
    // Check if in stdio mode for file path uploads
    if (!(transport instanceof StdioServerTransport)) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'File path uploads are only supported in stdio mode'
      );
    }
    
    // Read file from path
    try {
      binaryData = await promisify(fs.readFile)(args.data);
    } catch (fileError) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Unable to read file at path: ${args.data}`
      );
    }
    name = args.data.split('/').pop();
  } else {
    binaryData = Buffer.from(args.data, 'base64');
  }
  
  const redundancyLevel = args.redundancyLevel;
  const options: FileUploadOptions = {};

  // TODO check tag endpoint availability - gateway mode
  const deferred = binaryData.length > 5 * 1024 * 1024;
  options.deferred = deferred;
  options.redundancyLevel = redundancyLevel;
  
  let message = 'File successfully uploaded to Swarm';
  let tagId: string | undefined = undefined;
  // Create tag for deferred uploads or when explicitly requested
  if (deferred) {
    const tag = await bee.createTag();
    options.tag = tag.uid;
    tagId = tag.uid.toString();
    message = 'File upload started in deferred mode. Use query_upload_progress to track progress.';
  }
    
  // Start the deferred upload
  const result = await bee.uploadFile(config.bee.postageBatchId, binaryData, name, options);
  
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          reference: result.reference.toString(),
          url: config.bee.endpoint + '/bzz/' + result.reference.toString(),
          message,
          tagId,
        }, null, 2),
      },
    ],
  };
}
