import { Bee, PostageBatch } from "@ethersphere/bee-js";
import { PostageBatchCurated, PostageBatchSummary } from "../models";
import { NODE_STATUS_CHECK_CALL_TIMEOUT, NOT_FOUND_STATUS } from "../constants";

export function hexToBytes(hex: string): Uint8Array {
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

// From bee.js
const dateUnits: Record<string, number | undefined> = {
  ms: 1,
  milli: 1,
  millis: 1,
  millisecond: 1,
  milliseconds: 1,
  s: 1000,
  sec: 1000,
  second: 1000,
  seconds: 1000,
  m: 60_000,
  min: 60_000,
  minute: 60_000,
  minutes: 60_000,
  h: 3_600_000,
  hour: 3_600_000,
  hours: 3_600_000,
  d: 86_400_000,
  day: 86_400_000,
  days: 86_400_000,
  w: 604_800_000,
  week: 604_800_000,
  weeks: 604_800_000,
  month: 2_592_000_000,
  months: 2_592_000_000,
  y: 31_536_000_000,
  year: 31_536_000_000,
  years: 31_536_000_000,
};

// From bee.js
export function makeDate(numberWithUnit: string): number {
  const number = parseFloat(numberWithUnit);
  if (isNaN(number)) {
    throw Error("makeDate got NaN for input");
  }
  const unit = numberWithUnit
    .replace(/^-?[0-9.]+/, "")
    .trim()
    .toLowerCase();
  const multiplier = dateUnits[unit];
  if (!multiplier) {
    throw Error(`Unknown unit: "${unit}"`);
  }
  return number * multiplier;
}

// From bee.js
const storageUnits: Record<string, number | undefined> = {
  b: 1,
  byte: 1,
  bytes: 1,
  kb: 1024,
  kilobyte: 1024,
  kilobytes: 1024,
  mb: 1024 ** 2,
  megabyte: 1024 ** 2,
  megabytes: 1024 ** 2,
  gb: 1024 ** 3,
  gigabyte: 1024 ** 3,
  gigabytes: 1024 ** 3,
  tb: 1024 ** 4,
  terabyte: 1024 ** 4,
  terabytes: 1024 ** 4,
};

// From bee.js
export function makeStorage(numberWithUnit: string): number {
  const number = parseFloat(numberWithUnit);
  if (isNaN(number)) {
    throw Error("makeStorage got NaN for input");
  }
  const unit = numberWithUnit
    .replace(/^-?[0-9.]+/, "")
    .trim()
    .toLowerCase();
  const multiplier = storageUnits[unit];
  if (!multiplier) {
    throw Error(`Unknown unit: "${unit}"`);
  }
  return number * multiplier;
}
