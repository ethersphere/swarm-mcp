import { Bee, PostageBatch } from "@ethersphere/bee-js";
import { PostageBatchCurated, PostageBatchSummary } from "../models";
import { NODE_STATUS_CHECK_CALL_TIMEOUT, NOT_FOUND_STATUS } from "../constants";

export function hexToBytes(hex: string): Uint8Array {
  if (hex.startsWith("0x")) {
    hex = hex.slice(2);
  }

  if (hex.length % 2 !== 0) {
    throw new Error(`Hex string must have an even length, got ${hex.length}`);
  }

  if (!/^[0-9a-fA-F]*$/.test(hex)) {
    throw new Error("Invalid hexadecimal string");
  }

  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

export interface ToolResponse {
  [x: string]: unknown;
  tools?: { [x: string]: unknown; name: string /* other properties */ };
  _meta?: { [x: string]: unknown };
}

export const getBatchSummary = (
  batch: PostageBatch | PostageBatchCurated
): PostageBatchSummary => ({
  stampID:
    typeof batch.batchID === "string" ? batch.batchID : batch.batchID.toHex(),
  usage: batch.usageText,
  capacity: `${batch.remainingSize.toFormattedString()} remaining out of ${batch.size.toFormattedString()}`,
  immutable: batch.immutableFlag,
  ttl: `${batch.duration.represent()} (${batch.duration
    .toEndDate()
    .toDateString()})`,
});

export const getResponseWithStructuredContent = <T>(data: T): ToolResponse => ({
  content: [
    {
      type: "text",
      text: JSON.stringify(data, null, 2),
    },
  ],
  structuredContent: data,
});

export const errorHasStatus = (error: unknown, status: number) => {
  if (typeof error === "object" && error !== null && "status" in error) {
    return error.status === status;
  }

  return false;
};

export const getErrorMessage = (error: unknown) => {
  if (
    typeof error === "object" &&
    error !== null &&
    "responseBody" in error &&
    typeof error.responseBody === "object" &&
    error.responseBody !== null &&
    "message" in error.responseBody
  ) {
    return error.responseBody.message as string;
  }

  return "";
};

export const runWithTimeout = async <T>(
  asyncAction: Promise<T>,
  timeout: number
): Promise<[unknown, boolean]> => {
  let hasTimedOut = false;

  const timeoutPromise = new Promise((resolve) =>
    setTimeout(() => {
      hasTimedOut = true;
      resolve(true);
    }, timeout)
  );

  const response = await Promise.race([asyncAction, timeoutPromise]);

  return [response, hasTimedOut];
};

export const determineIfGateway = async (bee: Bee) => {
  let isGateway = false;

  try {
    // Request fails for gateways with 404.
    const getNodeInfoPromise =  bee.getNodeInfo();

    const [response, hasTimedOut] = await runWithTimeout(
      getNodeInfoPromise,
      NODE_STATUS_CHECK_CALL_TIMEOUT
    );

    isGateway = hasTimedOut;
  } catch (error) {
    if (errorHasStatus(error, NOT_FOUND_STATUS)) {
      isGateway = true;
    }
  }
  
  return isGateway;
};
