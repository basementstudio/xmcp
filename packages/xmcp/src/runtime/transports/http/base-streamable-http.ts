import { ServerConfig } from "@/compiler/config/schemas";
import { IncomingMessage, ServerResponse } from "http";

export interface HttpTransportOptions {
  port?: number;
  host?: string;
  endpoint?: string;
  bodySizeLimit?: string;
  debug?: boolean;
  serverOptions?: ServerConfig;
}

export interface JsonRpcMessage {
  jsonrpc: string;
  method?: string;
  params?: any;
  id?: string | number | null;
  result?: any;
  error?: any;
}

// shared between stateless and stateful transports
// just to paint the same interface
export abstract class BaseHttpServerTransport {
  // If we ever want to have more control over the transport, we can add onclose, onerror, onmessage here
  // or interceptors for requests and responses
  // e.g. to add a custom header to the response or a middleware layer!

  // to do add the logging methods like log and error
  // MCP SDK transport interface
  onmessage?: (message: JsonRpcMessage) => void;
  onerror?: (error: Error) => void;
  onclose?: () => void;

  abstract start(): Promise<void>;
  abstract close(): Promise<void>;
  abstract send(message: JsonRpcMessage): Promise<void>;
  abstract handleRequest(
    req: IncomingMessage,
    res: ServerResponse,
    parsedBody?: unknown
  ): Promise<void>;
}
