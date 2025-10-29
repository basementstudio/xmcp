import type { OutgoingHttpHeaders, ServerResponse } from "node:http";
import { EventEmitter } from "node:events";
import { normalizeHeaders } from "./utils/headers";

/**
 * Node.js ServerResponse to Web Response API.
 *
 * The MCP transport only uses simple synchronous patterns:
 * - res.writeHead(code, headers).end(body)
 * - res.writeHead(code).end()
 * - res.on('close', ...) and res.on('finish', ...)
 *
 */
export function nodeToWebAdapter(
  signal: AbortSignal,
  handler: (res: ServerResponse) => Promise<void> | void
): Promise<Response> {
  return new Promise((resolve) => {
    const emitter = new EventEmitter();
    let statusCode = 200;
    let headers: OutgoingHttpHeaders | undefined;
    let body = "";
    let headersWritten = false;
    let resolved = false;

    // Setup abort signal handling
    signal.addEventListener("abort", () => {
      emitter.emit("close");
    });

    // Create mock response object - use arrow functions to properly capture `this`
    const mockResponse = {
      writeHead(
        code: number,
        statusMessageOrHeaders?: string | OutgoingHttpHeaders,
        headersArg?: OutgoingHttpHeaders
      ) {
        statusCode = code;
        if (typeof statusMessageOrHeaders === "string") {
          headers = headersArg;
        } else {
          headers = statusMessageOrHeaders;
        }
        headersWritten = true;
        return mockResponse;
      },

      write(chunk: Buffer | string): boolean {
        if (!resolved) {
          body += chunk.toString();
        }
        return true;
      },

      end(data?: Buffer | string) {
        if (resolved) {
          return mockResponse;
        }

        if (data) {
          body += data.toString();
        }

        // Ensure headers were written (default to 200 if not)
        if (!headersWritten) {
          statusCode = 200;
          headersWritten = true;
        }

        resolved = true;

        // Create Web Response
        resolve(
          new Response(body, {
            status: statusCode,
            headers: normalizeHeaders(headers),
          })
        );

        emitter.emit("finish");
        return mockResponse;
      },

      on(event: string, listener: (...args: unknown[]) => void) {
        emitter.on(event, listener);
        return mockResponse;
      },

      get statusCode(): number {
        return statusCode;
      },

      set statusCode(code: number) {
        statusCode = code;
      },

      get headersSent(): boolean {
        return headersWritten;
      },
    } as ServerResponse;

    // Execute handler
    void handler(mockResponse);
  });
}
