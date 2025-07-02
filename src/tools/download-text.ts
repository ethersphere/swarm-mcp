/**
 * MCP Tool: download_text
 * Retrieve text data from Swarm
 */
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { Bee } from '@ethersphere/bee-js';
import { Wallet } from '@ethereumjs/wallet';
import crypto from 'crypto';
import config from '../config';
import { hexToBytes, ToolResponse } from '../utils';

export interface DownloadTextArgs {
  reference: string;
  isMemoryTopic?: boolean;
}

export async function downloadText(args: DownloadTextArgs, bee: Bee): Promise<ToolResponse> {
  if (!args.reference) {
    throw new McpError(
      ErrorCode.InvalidParams,
      'Missing required parameter: reference'
    );
  }

  let textData: string;
  
  if (args.isMemoryTopic) {
    console.log(`[API] Downloading text from Swarm feed with topic: ${args.reference}`);
    
    if (!config.bee.feedPrivateKey) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Feed private key not configured. Set BEE_FEED_PK environment variable.'
      );
    }
    
    // Process topic - if not a hex string, hash it
    let topic = args.reference;
    if (topic.startsWith('0x')) {
      topic = topic.slice(2);
    }
    const isHexString = /^[0-9a-fA-F]{64}$/.test(topic);
    
    if (!isHexString) {
      // Hash the topic string using SHA-256
      const hash = crypto.createHash('sha256').update(args.reference).digest('hex');
      topic = hash;
    }
    
    // Convert topic string to bytes
    const topicBytes = hexToBytes(topic);
    
    const feedPrivateKey = hexToBytes(config.bee.feedPrivateKey);
    const signer = new Wallet(feedPrivateKey);
    const owner = signer.getAddressString().slice(2);
    
    // Use feed reader to get the latest update
    const feedReader = bee.makeFeedReader(topicBytes, owner);
    const latestUpdate = await feedReader.downloadPayload();
    // Download the referenced data
    textData = latestUpdate.payload.toUtf8();

    console.log(`[API] Successfully downloaded feed content with topic: ${args.reference}`);
  } else {
    console.log(`[API] Downloading text from Swarm with reference: ${args.reference}`);
    const data = await bee.downloadData(args.reference);
    textData = data.toUtf8();
  }
  
  return {
    content: [
      {
        type: 'text',
        text: textData,
      },
    ],
  };
}
