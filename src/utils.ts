export function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

export interface ToolResponse {
    [x: string]: unknown;
    tools?: { [x: string]: unknown; name: string; /* other properties */ };
    _meta?: { [x: string]: unknown; };
}