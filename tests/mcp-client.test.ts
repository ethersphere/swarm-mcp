import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";

describe('can list tools', () => {
  let client: Client;

  // Setup before tests
  beforeAll(async () => {
    const transport = new StdioClientTransport({
        command: "node",
        args: ["dist/index.js"]
      });
      
    client = new Client({
        name: "example-client",
        version: "1.0.0"
    });

    await client.connect(transport);
  });

  afterAll(async () => {
    await client.close();
  });

  test('List all Tools', async () => {
      const tools = await client.listTools();
      
      expect(tools).toBeDefined();
      expect(tools.tools).toHaveLength(5);
      expect(tools.tools.map(t => t.name)).toEqual([
        'upload_text', 
        'download_text', 
        'upload_file', 
        'upload_folder', 
        'download_folder'
      ]);
  });
});
