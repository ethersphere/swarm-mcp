/**
 * MCP Tool: update_feed
 * Update the feed of a given topic with new data.
 */
import { Bee } from "@ethersphere/bee-js";
import { Wallet } from "@ethereumjs/wallet";
import crypto from "crypto";
import config from "../../config";
import {
  errorHasStatus,
  getErrorMessage,
  getResponseWithStructuredContent,
  getToolErrorResponse,
  hexToBytes,
  ToolResponse,
} from "../../utils";
import { getUploadPostageBatchId } from "../../utils/upload-stamp";
import { UpdateFeedArgs } from "./models";
import { BAD_REQUEST_STATUS } from "../../constants";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";

export async function updateFeed(
  args: UpdateFeedArgs,
  bee: Bee
): Promise<ToolResponse> {
  if (!args.data) {
    return getToolErrorResponse("Missing required parameter: data.");
  } else if (!args.memoryTopic) {
    return getToolErrorResponse("Missing required parameter: topic.");
  }

  const { postageBatchId, error } = await getUploadPostageBatchId(
    args.postageBatchId,
    bee
  );

  if (error !== null) {
    return getToolErrorResponse(error);
  } else if (postageBatchId === null) {
    return getToolErrorResponse("No postage batch id.");
  }

  const binaryData = Buffer.from(args.data);

  // Feed upload if memoryTopic is specified
  if (!config.bee.feedPrivateKey) {
    return getToolErrorResponse(
      "Feed private key not configured. Set BEE_FEED_PK environment variable."
    );
  }

  // Process topic - if not a hex string, hash it
  let topic = args.memoryTopic;
  if (topic.startsWith("0x")) {
    topic = topic.slice(2);
  }
  const isHexString = /^[0-9a-fA-F]{64}$/.test(args.memoryTopic);

  if (!isHexString) {
    // Hash the topic string using SHA-256
    const hash = crypto
      .createHash("sha256")
      .update(args.memoryTopic)
      .digest("hex");
    topic = hash;
  }

  // Convert topic string to bytes
  let topicBytes: Uint8Array;
  try {
    topicBytes = hexToBytes(topic);
  } catch (error) {
    return getToolErrorResponse("Invalid topic");
  }

  let feedPrivateKey: Uint8Array;
  try {
    feedPrivateKey = hexToBytes(config.bee.feedPrivateKey);
  } catch (error) {
    throw new McpError(
      ErrorCode.InternalError,
      `Invalid feed private key: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
  const signer = new Wallet(feedPrivateKey);
  const owner = signer.getAddressString().slice(2);

  let result;

  try {
    const feedWriter = bee.makeFeedWriter(topicBytes, feedPrivateKey);

    result = await feedWriter.uploadPayload(postageBatchId, binaryData);
  } catch (error) {
    const errorMsg = errorHasStatus(error, BAD_REQUEST_STATUS)
      ? getErrorMessage(error)
      : "Unable to update feed.";

    return getToolErrorResponse(errorMsg);
  }

  const reference = result.reference.toString();

  return getResponseWithStructuredContent({
    reference,
    topicString: args.memoryTopic,
    topic: topic,
    feedUrl: `${config.bee.endpoint}/feeds/${owner}/${topic}`,
    message: "Data successfully uploaded to Swarm and linked to feed",
  });
}
