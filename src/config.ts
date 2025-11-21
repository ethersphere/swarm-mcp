import dotenv from "dotenv";
import { DEFERRED_UPLOAD_SIZE_THRESHOLD_MB } from "./constants";

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
    endpoint: process.env.BEE_API_URL || "https://api.gateway.ethswarm.org",
    feedPrivateKey: process.env.BEE_FEED_PK,
    autoAssignStamp:
      process.env.AUTO_ASSIGN_STAMP !== undefined
        ? process.env.AUTO_ASSIGN_STAMP === "true"
        : true,
    deferredUploadSizeThreshold:
      Number(process.env.DEFERRED_UPLOAD_SIZE_THRESHOLD_MB) ||
      DEFERRED_UPLOAD_SIZE_THRESHOLD_MB,
  },
};

export default config;

