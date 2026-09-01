/**
 * Local (offline) computation of the Swarm /bzz reference for a single-file
 * upload, mirroring how the Bee node builds the manifest: a root "/" fork
 * carrying `website-index-document`, plus a `<filename>` fork carrying
 * `Content-Type` and `Filename` metadata pointing at the content's BMT root.
 *
 * Only valid for redundancyLevel 0 — erasure coding adds parity chunks that
 * change the tree, so callers must skip prediction when redundancy is used.
 */
import { MantarayNode, MerkleTree, NULL_ADDRESS } from "@ethersphere/bee-js";
import { createReadStream } from "fs";
import path from "path";

const MIME_TYPES: Record<string, string> = {
  css: "text/css",
  csv: "text/csv",
  gif: "image/gif",
  htm: "text/html",
  html: "text/html",
  ico: "image/x-icon",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  js: "text/javascript",
  json: "application/json",
  md: "text/markdown",
  mjs: "text/javascript",
  mp3: "audio/mpeg",
  mp4: "video/mp4",
  pdf: "application/pdf",
  png: "image/png",
  svg: "image/svg+xml",
  txt: "text/plain",
  wasm: "application/wasm",
  webp: "image/webp",
  xml: "application/xml",
  yaml: "application/yaml",
  yml: "application/yaml",
  zip: "application/zip",
};

export const RAW_CONTENT_TYPE = "text/plain; charset=utf-8";
export const DEFAULT_CONTENT_TYPE = "application/octet-stream";

/**
 * Content type sent with the upload. Must be deterministic on our side:
 * the Bee node stores it verbatim in the manifest, so whatever we send is
 * what the locally computed reference has to assume.
 */
export function getContentType(fileName: string): string {
  const extension = path.extname(fileName).replace(".", "").toLowerCase();
  return MIME_TYPES[extension] || DEFAULT_CONTENT_TYPE;
}

/**
 * Compute the /bzz reference the Bee node will return for this upload,
 * without uploading. File paths are hashed via a read stream so large files
 * are never held in memory.
 */
export async function computeFileReference(
  data: string,
  isPath: boolean,
  name: string | undefined,
  contentType: string
): Promise<string> {
  const tree = new MerkleTree(MerkleTree.NOOP);
  if (isPath) {
    for await (const piece of createReadStream(data)) {
      await tree.append(piece as Uint8Array);
    }
  } else {
    await tree.append(Buffer.from(data));
  }
  const contentRef = (await tree.finalize()).hash();

  // Bee uses the content hash hex as the file name when none is provided.
  const fileName = name ?? Buffer.from(contentRef).toString("hex");

  const mantaray = new MantarayNode();
  mantaray.addFork("/", NULL_ADDRESS, {
    "website-index-document": fileName,
  });
  mantaray.addFork(fileName, contentRef, {
    "Content-Type": contentType,
    Filename: fileName,
  });

  return (await mantaray.calculateSelfAddress()).toHex();
}
