import type { OutgoingHttpHeaders, ServerResponse } from "node:http";
import { EventEmitter } from "node:events";

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
    const bodyChunks: Uint8Array[] = [];
    let headersWritten = false;
    let resolved = false;
    let destroyed = false;

    const appendBodyChunk = (chunk: Buffer | Uint8Array | string) => {
      if (typeof chunk === "string") {
        bodyChunks.push(Buffer.from(chunk));
        return;
      }

      bodyChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    };

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

      write(chunk: Buffer | Uint8Array | string): boolean {
        if (!resolved) {
          appendBodyChunk(chunk);
        }
        return true;
      },

      end(data?: Buffer | Uint8Array | string) {
        if (resolved) {
          return mockResponse;
        }

        if (data) {
          appendBodyChunk(data);
        }

        // Ensure headers were written (default to 200 if not)
        if (!headersWritten) {
          statusCode = 200;
          headersWritten = true;
        }

        resolved = true;

        // Create Web Response
        resolve(
          new Response(Buffer.concat(bodyChunks), {
            status: statusCode,
            headers: headers as Record<string, string>,
          })
        );

        emitter.emit("finish");
        return mockResponse;
      },

      on(event: string, listener: (...args: unknown[]) => void) {
        emitter.on(event, listener);
        return mockResponse;
      },

      off(event: string, listener: (...args: unknown[]) => void) {
        emitter.off(event, listener);
        return mockResponse;
      },

      removeListener(event: string, listener: (...args: unknown[]) => void) {
        emitter.removeListener(event, listener);
        return mockResponse;
      },

      destroy(_error?: Error) {
        destroyed = true;
        emitter.emit("close");
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

      get destroyed(): boolean {
        return destroyed;
      },

      get writable(): boolean {
        return !destroyed;
      },
    } as ServerResponse;

    // Execute handler
    Promise.resolve(handler(mockResponse)).catch((error) => {
      console.error("Handler error:", error);
      if (!resolved) {
        resolve(new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 }));
      }
    });
  });
}
