import { PostageBatch } from "@ethersphere/bee-js";

export type PostageBatchCurated = Omit<PostageBatch, "batchID"> & {
  batchID: string;
};

export interface PostageBatchSummary {
  stampID: string;
  usage: string;
  capacity: string;
  ttl: string;
  immutable: boolean;
}

export interface ResponseContent<U, V> {
  raw: U;
  summary: V;
}

export interface ResponseWithStructuredContent<T> {
  content: Array<{ type: "text"; text: string }>;
  structuredContent: T;
}
