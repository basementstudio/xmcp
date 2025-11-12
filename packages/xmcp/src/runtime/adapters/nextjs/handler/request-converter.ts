import { type IncomingHttpHeaders, IncomingMessage } from "node:http";
import { Socket } from "node:net";
import { Readable } from "node:stream";
import type { AuthInfo } from "@socotra/modelcontextprotocol-sdk/server/auth/types";

export interface RequestConversionOptions {
  method: string;
  url: string;
  headers: IncomingHttpHeaders;
  auth?: AuthInfo;
}

/**
 * Creates a Node.js IncomingMessage from Web Request options.
 * This adapter enables the MCP SDK to work with Web Request objects.
 *
 * Note: Since we always pass parsedBody to the transport, the stream body
 * is never read. The stream methods are only bound for interface compatibility.
 */
export function createIncomingMessage(
  options: RequestConversionOptions
): IncomingMessage & { auth?: AuthInfo } {
  const { method, url, headers, auth } = options;

  // Create a minimal readable stream for interface compatibility
  // The stream is never actually read since we always provide parsedBody
  const readable = new Readable();
  readable._read = (): void => {};
  readable.push(null); // End stream immediately

  // Create IncomingMessage instance
  const req = new IncomingMessage(new Socket()) as IncomingMessage & {
    auth?: AuthInfo;
  };

  // Set request properties
  req.method = method;
  req.url = url;
  req.headers = headers;

  // Set auth if available (can be set by middleware)
  if (auth) {
    req.auth = auth;
  }

  // Bind stream methods for interface compatibility (not actually used)
  req.push = readable.push.bind(readable);
  req.read = readable.read.bind(readable);
  // @ts-expect-error - Required for MCP SDK compatibility
  req.on = readable.on.bind(readable);
  req.pipe = readable.pipe.bind(readable);

  return req;
}
