/**
 * MCP Tool: read_feed
 * Retrieve the latest data from the feed of a given topic.
 */
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { Bee } from "@ethersphere/bee-js";
import { Wallet } from "@ethereumjs/wallet";
import crypto from "crypto";
import config from "../../config";
import {
  getResponseWithStructuredContent,
  hexToBytes,
  ToolResponse,
} from "../../utils";
import { ReadFeedArgs } from "./models";

export async function readFeed(
  args: ReadFeedArgs,
  bee: Bee
): Promise<ToolResponse> {
  const { memoryTopic, owner } = args;
  if (!memoryTopic) {
    throw new McpError(
      ErrorCode.InvalidParams,
      "Missing required parameter: memoryTopic"
    );
  }

  console.error(
    `[API] Downloading text from Swarm feed with topic: ${memoryTopic}`
  );

  if (!config.bee.feedPrivateKey) {
    throw new McpError(
      ErrorCode.InvalidParams,
      "Feed private key not configured. Set BEE_FEED_PK environment variable."
    );
  }

  // Process topic - if not a hex string, hash it
  let topic = memoryTopic;
  if (topic.startsWith("0x")) {
    topic = topic.slice(2);
  }
  const isHexString = /^[0-9a-fA-F]{64}$/.test(topic);

  if (!isHexString) {
    // Hash the topic string using SHA-256
    const hash = crypto.createHash("sha256").update(memoryTopic).digest("hex");
    topic = hash;
  }

  // Convert topic string to bytes
  const topicBytes = hexToBytes(topic);

  let feedOwner = owner;
  if (!feedOwner) {
    const feedPrivateKey = hexToBytes(config.bee.feedPrivateKey);
    const signer = new Wallet(feedPrivateKey);
    feedOwner = signer.getAddressString().slice(2);
  } else {
    //sanitize owner
    if (feedOwner.startsWith("0x")) {
      feedOwner = feedOwner.slice(2);
    }
    if (feedOwner.length !== 40) {
      throw new McpError(
        ErrorCode.InvalidParams,
        "Owner must be a valid Ethereum address"
      );
      // TODO later support ENS
    }
  }

  // Use feed reader to get the latest update
  const feedReader = bee.makeFeedReader(topicBytes, feedOwner);
  const latestUpdate = await feedReader.downloadPayload();
  // Download the referenced data
  const textData = latestUpdate.payload.toUtf8();

  return getResponseWithStructuredContent({
    textData,
  });
}
