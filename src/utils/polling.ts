import { Bee, Tag } from "@ethersphere/bee-js";

export interface UploadProgress {
  synced: number;
  seen: number;
  processed: number;
  total: number;
  processedPercentage: number;
  isComplete: boolean;
  startedAt?: string;
  tagAddress: string;
}

/**
 * Retrieves the tag from Bee and calculates upload progress stats.
 *
 * @param bee - The Bee instance
 * @param tagUid - The tag UID to retrieve
 * @returns UploadProgress object with calculated stats
 */
export async function getUploadProgress(
  bee: Bee,
  tagUid: number
): Promise<UploadProgress> {
  const tag: Tag = await bee.retrieveTag(tagUid);

  const synced = tag.synced ?? 0;
  const seen = tag.seen ?? 0;
  const processed = synced + seen;
  const total = tag.split ?? 0;

  const processedPercentage =
    total > 0 ? Math.round((processed / total) * 100) : 0;
  const isComplete = processedPercentage === 100;

  return {
    synced,
    seen,
    processed,
    total,
    processedPercentage,
    isComplete,
    startedAt: tag.startedAt,
    tagAddress: tag.address,
  };
}
