/**
 * Configuration for the MCP server and Bee client
 */
export interface ServerConfig {
  port: number;
}

export interface BeeConfig {
  endpoint: string;
  postageBatchId: string;
  feedPrivateKey?: string;
}

export interface Config {
  server: ServerConfig;
  bee: BeeConfig;
}

const config: Config = {
  // Server configuration
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
  },
  
  // Bee API configuration
  bee: {
    endpoint: process.env.BEE_API_URL || 'https://api.gateway.ethswarm.org',
    postageBatchId: process.env.BEE_BATCH_ID || '0000000000000000000000000000000000000000000000000000000000000000', // Default postage batch ID
    feedPrivateKey: process.env.BEE_FEED_PK,
  }
};

export default config;
