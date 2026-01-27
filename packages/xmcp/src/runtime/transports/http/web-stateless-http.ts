import { Transport } from "@modelcontextprotocol/sdk/shared/transport";
import { MessageExtraInfo } from "@modelcontextprotocol/sdk/types";
import { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types";

export interface JsonRpcMessage {
  jsonrpc: string;
  method?: string;
  params?: any;
  id?: string | number | null;
  result?: any;
  error?: any;
}

/**
 * Web API-based stateless HTTP transport for Cloudflare Workers.
 * Uses only Web APIs (no Node.js dependencies).
 */
export class WebStatelessHttpTransport implements Transport {
  private debug: boolean;
  private _started: boolean = false;

  // Promise-based response collection (replaces EventEmitter pattern)
  private _responseResolvers: Map<
    string,
    {
      requestIds: Set<string | number>;
      responses: JsonRpcMessage[];
      resolve: (response: Response) => void;
    }
  > = new Map();
  private _requestToCollectorMapping: Map<string | number, string> = new Map();

  // MCP SDK transport interface
  onmessage?: (message: JsonRpcMessage, extra?: MessageExtraInfo) => void;
  onerror?: (error: Error) => void;
  onclose?: () => void;

  constructor(debug: boolean = false) {
    this.debug = debug;
  }

  private log(message: string, ...args: any[]): void {
    if (this.debug) {
      console.log(`[WebStatelessHTTP] ${message}`, ...args);
    }
  }

  async start(): Promise<void> {
    if (this._started) {
      throw new Error("Transport already started");
    }
    this._started = true;
  }

  async close(): Promise<void> {
    // Resolve any pending requests with service unavailable
    this._responseResolvers.forEach((collector) => {
      collector.resolve(
        new Response(
          JSON.stringify({
            jsonrpc: "2.0",
            error: {
              code: -32000,
              message: "Service unavailable: Server shutting down",
            },
            id: null,
          }),
          {
            status: 503,
            headers: { "Content-Type": "application/json" },
          }
        )
      );
    });
    this._responseResolvers.clear();
    this._requestToCollectorMapping.clear();
  }

  async send(message: JsonRpcMessage): Promise<void> {
    const requestId = message.id;

    if (requestId === undefined || requestId === null) {
      // In stateless mode, we can't handle notifications without request IDs
      if (this.debug) {
        this.log("Dropping notification without request ID");
      }
      return;
    }

    const collectorId = this._requestToCollectorMapping.get(requestId);
    if (collectorId) {
      const collector = this._responseResolvers.get(collectorId);
      if (
        collector &&
        (message.result !== undefined || message.error !== undefined)
      ) {
        collector.responses.push(message);
        collector.requestIds.delete(requestId);

        // All responses collected, resolve the promise
        if (collector.requestIds.size === 0) {
          const responseBody =
            collector.responses.length === 1
              ? collector.responses[0]
              : collector.responses;

          collector.resolve(
            new Response(JSON.stringify(responseBody), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            })
          );

          // Cleanup
          this._responseResolvers.delete(collectorId);
          for (const response of collector.responses) {
            if (response.id !== undefined && response.id !== null) {
              this._requestToCollectorMapping.delete(response.id);
            }
          }
        }
      }
    }
  }

  /**
   * Handle an incoming Web Request and return a Web Response.
   * This is the main entry point for Cloudflare Workers.
   */
  async handleRequest(
    request: Request,
    authInfo?: AuthInfo
  ): Promise<Response> {
    // Only support POST in stateless mode
    if (request.method !== "POST") {
      return new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          error: {
            code: -32000,
            message: "Method not allowed.",
          },
          id: null,
        }),
        {
          status: 405,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return this.handlePOST(request, authInfo);
  }

  private async handlePOST(
    request: Request,
    authInfo?: AuthInfo
  ): Promise<Response> {
    try {
      const acceptHeader = request.headers.get("accept");
      const acceptsJson = acceptHeader?.includes("application/json");

      if (!acceptsJson) {
        return new Response(
          JSON.stringify({
            jsonrpc: "2.0",
            error: {
              code: -32000,
              message: "Not Acceptable: Client must accept application/json",
            },
            id: null,
          }),
          {
            status: 406,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const contentType = request.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        return new Response(
          JSON.stringify({
            jsonrpc: "2.0",
            error: {
              code: -32000,
              message:
                "Unsupported Media Type: Content-Type must be application/json",
            },
            id: null,
          }),
          {
            status: 415,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const rawMessage = await request.json();
      const messages: JsonRpcMessage[] = Array.isArray(rawMessage)
        ? rawMessage
        : [rawMessage];

      const hasRequests = messages.some(
        (msg) => msg.method && msg.id !== undefined
      );

      if (!hasRequests) {
        // Handle notifications (no response expected)
        return new Response(null, { status: 202 });
      }

      // Handle requests that expect responses
      const requestIds = messages
        .filter((msg) => msg.method && msg.id !== undefined)
        .map((msg) => msg.id!);

      if (requestIds.length === 0) {
        return new Response(null, { status: 202 });
      }

      // Create a promise that will resolve when all responses are collected
      const responsePromise = new Promise<Response>((resolve) => {
        const collectorId = crypto.randomUUID();
        this._responseResolvers.set(collectorId, {
          requestIds: new Set(requestIds),
          responses: [],
          resolve,
        });

        for (const requestId of requestIds) {
          this._requestToCollectorMapping.set(requestId, collectorId);
        }
      });

      // Process messages through MCP SDK transport interface
      for (const message of messages) {
        if (this.onmessage) {
          this.onmessage(message, { authInfo });
        }
      }

      // Wait for all responses
      return responsePromise;
    } catch (error) {
      return new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          error: {
            code: -32700,
            message: "Parse error",
            data: String(error),
          },
          id: null,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }
}
