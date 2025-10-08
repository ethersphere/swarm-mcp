/**
 * MCP Tool: query_upload_progress
 * Query upload progress for a specific upload session identified with the Tag ID
 */
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { Bee } from '@ethersphere/bee-js';
import { ToolResponse } from '../utils';

export interface QueryUploadProgressArgs {
  tagId: string;
}

// The third argument (transport) is accepted for parity with other tools but unused here
export async function queryUploadProgress(
  args: QueryUploadProgressArgs,
  bee: Bee,
  _transport?: unknown
): Promise<ToolResponse> {
  if (!args?.tagId) {
    throw new McpError(ErrorCode.InvalidParams, 'Missing required parameter: tagId');
  }

  const tagUid = Number.parseInt(args.tagId, 10);
  if (Number.isNaN(tagUid)) {
    throw new McpError(ErrorCode.InvalidParams, 'Invalid tagId format. Expected a numeric string.');
  }

  // TODO check tag endpoint availability - gateway mode

  try {
    const tag = await bee.retrieveTag(tagUid);

    const synced = tag.synced ?? 0;
    const seen = tag.seen ?? 0;
    const processed = synced + seen;
    const total = tag.split ?? 0;
    const startedAt = tag.startedAt;

    const processedPercentage = total > 0 ? Math.round((processed / total) * 100) : 0;
    const isComplete = processedPercentage === 100;

    let tagDeleted = false;
    if (isComplete) {
      try {
        await bee.deleteTag(tagUid);
        tagDeleted = true;
      } catch {
        // Non-fatal: if deletion fails we still return progress
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              processedPercentage,
              message: isComplete
                ? 'Upload completed successfully.'
                : `Upload progress: ${processedPercentage}% processed`,
              startedAt,
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (error: any) {
    const status = error?.status ?? error?.response?.status;
    if (status === 404) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Tag with ID ${args.tagId} does not exist or has been deleted`
      );
    }

    throw new McpError(
      ErrorCode.InternalError,
      `Failed to retrieve upload progress: ${error?.message ?? 'Unknown error'}`
    );
  }
}
