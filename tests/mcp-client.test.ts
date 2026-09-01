import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";

describe("can list tools", () => {
  let client: Client;

  // Setup before tests
  beforeAll(async () => {
    const transport = new StdioClientTransport({
      command: "node",
      args: ["dist/index.js"],
    });

    client = new Client({
      name: "example-client",
      version: "1.0.0",
    });

    await client.connect(transport);
  });

  afterAll(async () => {
    await client.close();
  });

  test("List all Tools", async () => {
    const tools = await client.listTools();

    expect(tools).toBeDefined();
    expect(tools.tools).toHaveLength(12);
    expect(tools.tools.map((t) => t.name)).toEqual([
      "upload_data",
      "update_feed",
      "download_data",
      "read_feed",
      "upload_file",
      "upload_folder",
      "download_files",
      "list_postage_stamps",
      "get_postage_stamp",
      "create_postage_stamp",
      "extend_postage_stamp",
      "query_upload_progress",
    ]);
  });
  test("Should fail validation with invalid parameters", async () => {
    await expect(
      client.callTool({
        name: "upload_data",
        arguments: {
          // Missing required 'data' field
          redundancyLevel: 0,
        },
      })
    ).rejects.toThrow();
  });
});
