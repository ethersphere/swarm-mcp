export const PostageBatchCuratedSchema = {
  type: "object",
  batchID: {
    type: "string",
    description: "The ID of the batch.",
  },
  usable: {
    type: "boolean",
    description: "Tells if the batch is usable.",
  },
  label: {
    type: "string",
    description: "The label of the batch.",
  },
  depth: {
    type: "number",
    description:
      "The depth of the batch, depth determines how much data can be stored by a batch.",
  },
  amount: {
    type: "string",
    description:
      "The amount parameter is the quantity of xBZZ in PLUR that is assigned per chunk in the batch.",
  },
  bucketDepth: {
    type: "number",
    description:
      "Bucket depth determines how the address space is partitioned, with each bucket storing chunks that share a common address prefix. Together with batch depth, bucket depth determines how many chunks are allowed in each bucket.",
  },
  blockNumber: {
    type: "number",
    description: "The block number.",
  },
  immutableFlag: {
    type: "boolean",
    description: "Flag telling if the batch is immutable.",
  },
  duration: {
    type: "object",
    description: "Estimated time until the batch expires.",
    properties: {
      seconds: {
        type: "number",
        description: "The estimated number of seconds until the batch expires.",
      },
    },
  },
  usage: {
    type: "number",
    description:
      "A floating point number from 0 to 1, where 0 is no usage, 1 is full usage.",
  },
  usageText: {
    type: "string",
    description: "Human readable usage text, like 50% or 100%, no fractions.",
  },
  size: {
    type: "object",
    description: "Effective size.",
    properties: {
      bytes: {
        type: "number",
        description: "Effective size number of bytes.",
      },
    },
  },
  remainingSize: {
    type: "object",
    description: "Estimated remaining size.",
    properties: {
      bytes: {
        type: "number",
        description: "Estimated remaining size number of bytes.",
      },
    },
  },
  theoreticalSize: {
    type: "object",
    description: "Theoretical size in bytes.",
    properties: {
      bytes: {
        type: "number",
        description: "Theoretical size number of bytes.",
      },
    },
  },
};

export const PostageBatchSummarySchema = {
  type: "object",
  properties: {
    stampID: {
      type: "string",
      description: "The ID of the stamp.",
    },
    usage: {
      type: "string",
      description: "The percentage of storage used.",
    },
    capacity: {
      type: "string",
      description: "The storage remaining from the total.",
    },
    ttl: {
      type: "string",
      description: "Time remaining until stamp batch expires.",
    },
    immutable: {
      type: "boolean",
      description: "Flag telling if the batch is immutable.",
    },
  },
};
