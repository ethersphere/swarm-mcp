import {
  PostageBatchCuratedSchema,
  PostageBatchSummarySchema,
} from "./postage-batch";

export const SwarmToolsSchema = [
  {
    name: "upload_data",
    title: "Upload data",
    description:
      "Upload arbitrary text data to Swarm as an immutable, content-addressed blob. Returns a Swarm reference hash that permanently identifies the uploaded bytes. " +
      'Use this tool whenever the user asks to "upload data", "upload text", "store data", or similar, without mentioning a feed, topic, or memory. ' +
      "This is NOT a feed operation — if the user wants mutable, topic-indexed storage (i.e. mentions a feed, topic, or memory name), use `update_feed` instead. " +
      "Only `data` is required. `redundancyLevel` and `postageBatchId` are optional — use their defaults and do NOT ask the user for them unless the user explicitly brings them up.",
    inputSchema: {
      type: "object",
      properties: {
        data: {
          type: "string",
          description:
            "The literal string content to upload, taken verbatim from the user's message. " +
            "Pass the exact text the user provided (typically the text after phrases like \"upload data:\", \"upload:\", \"store:\", or similar), even if the value looks like a short identifier, a placeholder name (e.g. 'Text1', 'Message1', 'foo'), or otherwise seems like a variable — it is the content itself. " +
            "Do not ask the user to clarify or expand the content; do not substitute your own text.",
        },
        redundancyLevel: {
          type: "number",
          description:
            "Optional redundancy level for fault tolerance " +
            "(higher values provide better fault tolerance but increase storage overhead): " +
            "0 - none, 1 - medium, 2 - strong, 3 - insane, 4 - paranoid. " +
            "Default is 0. Do not ask the user for this value; only set it if the user explicitly requests a redundancy level.",
          default: 0,
        },
        postageBatchId: {
          type: "string",
          description:
            "Optional. The id of the batch which will be used to perform the upload. " +
            "Do not ask the user for this value; only set it if the user explicitly provides a batch id.",
          default: undefined,
        },
      },
      required: ["data"],
    },
    outputSchema: {
      type: "object",
      properties: {
        reference: {
          type: "string",
          description: "Swarm reference hash for uploaded data.",
        },
        url: {
          type: "string",
          description: "URL to access uploaded data.",
        },
        message: {
          type: "string",
          description: "Upload response message.",
        },
      },
      required: ["reference", "url"],
    },
    execution: {
      taskSupport: "forbidden",
    },
  },
  {
    name: "update_feed",
    title: "Update feed",
    description:
      "Update a mutable, topic-indexed Swarm feed with new data. Requires a `memoryTopic` supplied by the user. " +
      "Use this tool ONLY when the user explicitly mentions a feed, topic, or memory name. " +
      "If the user asks to upload data without mentioning a feed/topic/memory, use `upload_data` instead — do NOT prompt the user for a topic to route them here. " +
      "`postageBatchId` is optional — do not ask the user for it unless they explicitly bring it up.",
    inputSchema: {
      type: "object",
      properties: {
        data: {
          type: "string",
          description:
            "The literal string content to write to the feed, taken verbatim from the user's message. " +
            "Pass the exact text the user provided (typically the text after phrases like \"with:\", \"update with:\", \"set to:\", or similar), even if the value looks like a short identifier, a placeholder name (e.g. 'Message1', 'foo'), or otherwise seems like a variable — it is the content itself. " +
            "Do not ask the user to clarify or expand the content; do not substitute your own text.",
        },
        memoryTopic: {
          type: "string",
          description:
            "Required. Must be supplied by the user. If missing, ask the user — never invent, hash, or derive from the data. " +
            "The feed topic. Pass exactly whatever the user names it as a plain string (e.g. 'notes', 'Topic1', 'game-state') -- the server hashes non-hex strings into a topic automatically. Do NOT derive it from the data. Only ask the user if they gave no topic at all.",
        },
        postageBatchId: {
          type: "string",
          description:
            "The id of the batch which will be used to perform the upload.",
          default: undefined,
        },
      },
      required: ["data", "memoryTopic"],
    },
    outputSchema: {
      type: "object",
      properties: {
        reference: {
          type: "string",
          description: "Swarm reference hash for feed update.",
        },
        topicString: {
          type: "string",
          description: "The topic string.",
        },
        topic: {
          type: "string",
          description: "The topic.",
        },
        feedUrl: {
          type: "string",
          description: "The feed URL.",
        },
        message: {
          type: "string",
          description: "Update feed response message.",
        },
      },
      required: ["reference", "topic", "feedUrl"],
    },
    execution: {
      taskSupport: "forbidden",
    },
  },
  {
    name: "download_data",
    title: "Download data",
    description:
      "Download raw text data from a Swarm reference and return it as a string. " +
      "Use this tool ONLY when the user explicitly asks for the text content, string content, or raw data behind a reference, or when the reference is known to have been uploaded via `upload_data`. " +
      "If the user mentions \"file\", \"files\", \"folder\", or asks to \"download\" without specifying that they want the raw text content, use `download_files` instead. " +
      "When in doubt about the reference type, prefer `download_files` — it handles both single files and folder manifests and can be saved to disk.",
    inputSchema: {
      type: "object",
      properties: {
        reference: {
          type: "string",
          description: "Swarm reference hash.",
        },
      },
      required: ["reference"],
    },
    outputSchema: {
      type: "object",
      properties: {
        textData: {
          type: "string",
          description: "The downloaded data for the given reference.",
        },
      },
      required: ["textData"],
    },
    execution: {
      taskSupport: "forbidden",
    },
  },
  {
    name: "read_feed",
    title: "Read feed",
    description: "Retrieve the latest data from the feed of a given topic.",
    inputSchema: {
      type: "object",
      properties: {
        memoryTopic: {
          type: "string",
          description: "Feed topic.",
        },
        owner: {
          type: "string",
          description:
            "when accessing external memory or feed, ethereum address of the owner must be set",
        },
      },
      required: ["memoryTopic"],
    },
    outputSchema: {
      type: "object",
      properties: {
        textData: {
          type: "string",
          description: "The downloaded data for the given topic.",
        },
      },
      required: ["textData"],
    },
    execution: {
      taskSupport: "forbidden",
    },
  },
  {
    name: "upload_file",
    title: "Upload file",
    description:
      "Upload a SINGLE file to Swarm. To upload a local file, pass its filesystem path as `data` — the server reads the file itself (stdio mode only). " +
      "Alternatively, pass the raw text content directly as `data`. " +
      'This tool handles one file only — if the path refers to a directory, or the user mentions "folder", "directory", "the contents of", or otherwise asks to upload more than one file, use `upload_folder` instead and pass the path as its `folderPath`. ' +
      "Never ask the user for the file content when a path is given, and never pass a Swarm reference — references are the OUTPUT of this tool, not an input. " +
      "Small files upload synchronously and return a reference. Large files (over the server's deferred-upload threshold) upload in the background and immediately return the final reference (computed locally) plus a tagId for query_upload_progress; the content becomes retrievable at the reference once the upload completes. With redundancyLevel > 0 only the tagId is returned immediately. " +
      "Optional options (ignore if they are not requested): " +
      "redundancyLevel: redundancy level for fault tolerance. Optional, value is 0 if not requested. " +
      "postageBatchId: The postage stamp batch ID which will be used to perform the upload, if it is provided.",
    inputSchema: {
      type: "object",
      properties: {
        data: {
          type: "string",
          description: "File content or file path.",
        },
        redundancyLevel: {
          type: "number",
          description:
            "redundancy level for fault tolerance " +
            "(higher values provide better fault tolerance but increase storage overhead) " +
            "0 - none, 1 - medium, 2 - strong, 3 - insane, 4 - paranoid",
          default: 0,
        },
        postageBatchId: {
          type: "string",
          description:
            "The id of the batch which will be used to perform the upload.",
          default: undefined,
        },
      },
      required: ["data"],
    },
    execution: {
      taskSupport: "optional",
    },
  },
  {
    name: "upload_folder",
    title: "Upload folder",
    description:
      "Upload a folder (directory). " +
      'Use this tool whenever the user mentions "folder", "directory", "the contents of", or asks to upload a path that refers to a directory rather than one file — including phrasings like "upload to Swarm folder <path>", where <path> is the folder to upload, not a destination. ' +
      "Prefer this tool over `upload_file` when it is unclear whether a given path is a file or a directory: `upload_file` cannot upload a directory. " +
      "`folderPath` is REQUIRED — pass the folder path from the user's message verbatim. " +
      "Small folders upload synchronously and return the manifest `reference`. Large folders (over the server's deferred-upload threshold) upload in the background and return only a `tagId`; unlike `upload_file`, a folder's reference cannot be computed up front, so retrieve it by polling `query_upload_progress` with that tagId until processedPercentage is 100. " +
      "Optional options (ignore if they are not requested): " +
      "redundancyLevel: redundancy level for fault tolerance. Optional, value is 0 if not requested. " +
      "postageBatchId: The postage stamp batch ID which will be used to perform the upload, if it is provided.",
    inputSchema: {
      type: "object",
      properties: {
        folderPath: {
          type: "string",
          description:
            "Required. Path to the local folder to upload, taken verbatim from the user's message. " +
            "Do not ask the user to confirm or re-enter the path when one was already given.",
        },
        redundancyLevel: {
          type: "number",
          description:
            "redundancy level for fault tolerance " +
            "(higher values provide better fault tolerance but increase storage overhead) " +
            "0 - none, 1 - medium, 2 - strong, 3 - insane, 4 - paranoid",
          default: 0,
        },
        postageBatchId: {
          type: "string",
          description:
            "The id of the batch which will be used to perform the upload.",
          default: undefined,
        },
      },
      required: ["folderPath"],
    },
    execution: {
      taskSupport: "optional",
    },
  },
  {
    name: "download_files",
    title: "Download files",
    description:
      "Download a file or folder from a Swarm reference. Handles both single files and folder manifests, saves them to disk (in stdio mode) or returns the file list. " +
      "Use this tool whenever the user asks to \"download\" from a reference and mentions \"file\", \"files\", \"folder\", or does not specify the data type. " +
      "Prefer this tool over `download_data` unless the user explicitly asks for the raw text/string content behind a reference. " +
      "This is the safe default for downloads when the reference type is unknown.",
    inputSchema: {
      type: "object",
      properties: {
        reference: {
          type: "string",
          description: "Swarm reference hash",
        },
        filePath: {
          type: "string",
          description:
            "Optional destination FOLDER (not a filename) to save the downloaded content into (only available in stdio mode). " +
            "Files from the manifest are written inside this folder using their original names. " +
            "Absolute paths are recommended; relative paths resolve against the server's current working directory. " +
            "If omitted, files are saved into the server's current working directory.",
        },
      },
      required: ["reference"],
    },
    execution: {
      taskSupport: "optional",
    },
  },
  {
    name: "list_postage_stamps",
    title: "List postage stamps",
    description:
      "List the available postage stamps. Optional options (ignore if they are not requested): leastUsed, limit, minUsage(%), maxUsage(%).",
    inputSchema: {
      type: "object",
      properties: {
        leastUsed: {
          type: "boolean",
          description:
            "A boolean value that tells if stamps are sorted so least used comes first. " +
            "true - means that stamps should be sorted. " +
            "false - means that stamps should not be sorted. " +
            "Default is false.",
          default: false,
        },
        limit: {
          type: "number",
          description: "Limit is the maximum number of returned stamps.",
        },
        minUsage: {
          type: "number",
          description: "Only list stamps with at least this usage percentage",
        },
        maxUsage: {
          type: "number",
          description: "Only list stamps with at most this usage percentage.",
        },
      },
    },
    outputSchema: {
      type: "object",
      properties: {
        raw: {
          type: "array",
          items: PostageBatchCuratedSchema,
        },
        summary: {
          type: "array",
          items: PostageBatchSummarySchema,
        },
      },
      required: ["summary"],
    },
    execution: {
      taskSupport: "forbidden",
    },
  },
  {
    name: "get_postage_stamp",
    title: "Get postage stamp",
    description: "Get a specific postage stamp based on postageBatchId.",
    inputSchema: {
      type: "object",
      properties: {
        postageBatchId: {
          type: "string",
          description: "The id of the stamp which is requested.",
        },
      },
      required: ["postageBatchId"],
    },
    outputSchema: {
      type: "object",
      properties: {
        raw: PostageBatchCuratedSchema,
        summary: PostageBatchSummarySchema,
      },
      required: ["summary"],
    },
    execution: {
      taskSupport: "forbidden",
    },
  },
  {
    name: "create_postage_stamp",
    title: "Create postage stamp",
    description:
      "Buy a postage stamp based on size and duration. Buying a stamp spends BZZ and is not refundable. " +
      "Both `size` and `duration` MUST be explicitly stated by the user. " +
      "Do not infer, assume defaults, or synthesize plausible values for either. " +
      "If the user has not stated a size, or has not stated a duration, STOP and ask the user for the missing value before calling this tool.",
    inputSchema: {
      type: "object",
      properties: {
        size: {
          type: "string",
          description:
            "Storage capacity exactly as stated by the user, e.g. 1GB, 500MB, 1KB. " +
            "Do not guess, default, or invent a value. If the user did not state a size, ask them.",
        },
        duration: {
          type: "string",
          description:
            "Time to live of the postage stamp exactly as stated by the user, e.g. 1d - 1 day, 1w - 1 week, 1month - 1 month. " +
            "Do not guess, default, or invent a value. If the user did not state a duration, ask them.",
        },
        label: {
          type: "string",
          maxLength: 100,
          description:
            "Sets label for the postage batch (omit if the user didn't ask for one). Do not set a label with with specific capacity values because they can get misleading.",
        },
      },
      required: ["size", "duration"],
    },
    execution: {
      taskSupport: "optional",
    },
  },
  {
    name: "extend_postage_stamp",
    title: "Extend postage stamp",
    description:
      "Increase the duration (relative to current duration) and/or size of an existing postage stamp. " +
      "Extending a stamp spends BZZ and is not refundable. " +
      "Both `size` and `duration` are optional, but at least one must be provided. " +
      "Only pass values the user has explicitly stated — do not infer, assume defaults, or synthesize plausible values. " +
      "If the user's request is ambiguous about which dimension to extend or by how much, STOP and ask the user before calling this tool.",
    inputSchema: {
      type: "object",
      properties: {
        postageBatchId: {
          type: "string",
          description: "The id of the batch for which extend is performed.",
        },
        size: {
          type: "string",
          description:
            "Additional storage capacity exactly as stated by the user, e.g. 1GB, 500MB, 1KB. " +
            "Do not guess, default, or invent a value. Omit this field if the user did not state a size.",
        },
        duration: {
          type: "string",
          description:
            "Additional time to live exactly as stated by the user, e.g. 1d - 1 day, 1w - 1 week, 1month - 1 month. " +
            "Do not guess, default, or invent a value. Omit this field if the user did not state a duration.",
        },
      },
      required: ["postageBatchId"],
    },
    execution: {
      taskSupport: "optional",
    },
  },
  {
    name: "query_upload_progress",
    title: "Query upload progress",
    description:
      "Query upload progress for a specific upload session identified with the returned Tag ID. " +
      "Also returns the final Swarm `reference` of the upload — use this to obtain the reference for a deferred upload (notably `upload_folder`, whose reference cannot be computed up front) once processedPercentage reaches 100.",
    inputSchema: {
      type: "object",
      properties: {
        tagId: {
          type: "string",
          description:
            "Tag ID returned by upload_file and upload_folder tools to track upload progress",
        },
      },
      required: ["tagId"],
    },
    outputSchema: {
      type: "object",
      properties: {
        processedPercentage: {
          type: "number",
          description: "The deferred upload processed percentage.",
        },
        message: {
          type: "string",
          description: "Query upload response message.",
        },
        startedAt: {
          type: "string",
          description: "When it started.",
        },
        reference: {
          type: "string",
          description:
            "The Swarm reference hash of the uploaded content (the root manifest reference for folder uploads). " +
            "Meaningful once processedPercentage is 100; may be absent or zero while the upload is still in progress.",
        },
      },
      required: ["processedPercentage", "reference"],
    },
    execution: {
      taskSupport: "forbidden",
    },
  },
];
