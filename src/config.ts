import dotenv from "dotenv";
import {
  DEFAULT_GATEWAY_URL,
  DEFAULT_TASK_TTL_MS,
  DEFERRED_UPLOAD_SIZE_THRESHOLD_MB,
} from "./constants";

dotenv.config({ quiet: true });

/**
 * Configuration for the MCP server and Bee client
 */
export interface ServerConfig {
  port: number;
}

export interface BeeConfig {
  endpoint: string;
  feedPrivateKey?: string;
  autoAssignStamp: boolean;
  deferredUploadSizeThreshold: number;
  taskTtlMs: number;
}

export interface Config {
  server: ServerConfig;
  bee: BeeConfig;
}

const config: Config = {
  // Server configuration
  server: {
    port: parseInt(process.env.PORT || "3000", 10),
  },

  // Bee API configuration
  bee: {
    endpoint: process.env.BEE_API_URL || DEFAULT_GATEWAY_URL,
    feedPrivateKey: process.env.BEE_FEED_PK,
    autoAssignStamp:
      process.env.AUTO_ASSIGN_STAMP !== undefined &&
      process.env.AUTO_ASSIGN_STAMP !== ""
        ? process.env.AUTO_ASSIGN_STAMP === "true"
        : true,
    deferredUploadSizeThreshold:
      Number(process.env.DEFERRED_UPLOAD_SIZE_THRESHOLD_MB) ||
      DEFERRED_UPLOAD_SIZE_THRESHOLD_MB,
    taskTtlMs: Number(process.env.TASK_TTL_MS) || DEFAULT_TASK_TTL_MS,
  },
};

export default config;
