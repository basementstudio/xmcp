import type {
  AudioContent,
  EmbeddedResource,
  ImageContent,
} from "@modelcontextprotocol/server";

// Bound the arguments to fromCharCode so large files cannot overflow the stack.
const BASE64_CHUNK_SIZE = 0x8000;

function toBase64(value: Uint8Array | ArrayBuffer): string {
  let bytes: Uint8Array;
  if (value instanceof Uint8Array) bytes = value;
  else if (value instanceof ArrayBuffer) bytes = new Uint8Array(value);
  else throw new TypeError("Expected bytes as a Uint8Array or ArrayBuffer");

  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += BASE64_CHUNK_SIZE) {
    binary += String.fromCharCode(
      ...bytes.subarray(offset, offset + BASE64_CHUNK_SIZE)
    );
  }
  return btoa(binary);
}

/** Create an MCP image content block from raw bytes. */
export function image(
  bytes: Uint8Array | ArrayBuffer,
  mimeType: string
): ImageContent {
  return { type: "image", data: toBase64(bytes), mimeType };
}

/** Create an MCP audio content block from raw bytes. */
export function audio(
  bytes: Uint8Array | ArrayBuffer,
  mimeType: string
): AudioContent {
  return { type: "audio", data: toBase64(bytes), mimeType };
}

/** Embed text or binary resource contents without registering a resource. */
export function embeddedResource(
  uri: string,
  content: string | Uint8Array | ArrayBuffer,
  mimeType?: string
): EmbeddedResource {
  return {
    type: "resource",
    resource: {
      uri,
      ...(mimeType === undefined ? {} : { mimeType }),
      ...(typeof content === "string"
        ? { text: content }
        : { blob: toBase64(content) }),
    },
  };
}
