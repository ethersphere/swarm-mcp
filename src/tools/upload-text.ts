/**
 * MCP Tool: upload_text
 * Uploads text data to Swarm
 */
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { Bee } from '@ethersphere/bee-js';
import { Wallet } from '@ethereumjs/wallet';
import crypto from 'crypto';
import config from '../config';
import { hexToBytes, ToolResponse } from '../utils';

export interface UploadTextArgs {
  data: string;
  redundancyLevel?: number;
  memoryTopic?: string;
}

export async function uploadText(args: UploadTextArgs, bee: Bee): Promise<ToolResponse> {
  if (!args.data) {
    throw new McpError(
      ErrorCode.InvalidParams,
      'Missing required parameter: data'
    );
  }

  const binaryData = Buffer.from(args.data);

  const redundancyLevel = args.redundancyLevel;
  const options = redundancyLevel ? { redundancyLevel } : undefined;
  
  if (!args.memoryTopic) {
    const result = await bee.uploadData(config.bee.postageBatchId, binaryData, options);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            reference: result.reference.toString(),
            url: config.bee.endpoint + '/bytes/' + result.reference.toString(),
            message: 'Data successfully uploaded to Swarm',
          }, null, 2),
        },
      ],
    };
  } else {
    // Feed upload if memoryTopic is specified
    if (!config.bee.feedPrivateKey) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Feed private key not configured. Set BEE_FEED_PK environment variable.'
      );
    }
    
    // Process topic - if not a hex string, hash it
    let topic = args.memoryTopic;
    if (topic.startsWith('0x')) {
      topic = topic.slice(2);
    }
    const isHexString = /^[0-9a-fA-F]{64}$/.test(args.memoryTopic);
    
    if (!isHexString) {
      // Hash the topic string using SHA-256
      const hash = crypto.createHash('sha256').update(args.memoryTopic).digest('hex');
      topic = hash;
    }
    
    // Convert topic string to bytes
    const topicBytes = hexToBytes(topic);

    const feedPrivateKey = hexToBytes(config.bee.feedPrivateKey);
    const signer = new Wallet(feedPrivateKey);
    const owner = signer.getAddressString().slice(2);
    const feedWriter = bee.makeFeedWriter(topicBytes, feedPrivateKey);
    
    const result = await feedWriter.uploadPayload(config.bee.postageBatchId, binaryData);
    const reference = result.reference.toString();
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            reference,
            topicString: args.memoryTopic,
            topic: topic,
            feedUrl: `${config.bee.endpoint}/feeds/${owner}/${topic}`,
            message: 'Data successfully uploaded to Swarm and linked to feed',
          }, null, 2),
        },
      ],
    };
  }
}
