import type { ServerResponse } from "node:http";

export interface JsonRpcError {
  jsonrpc: "2.0";
  error: {
    code: number;
    message: string;
  };
  id: null;
}

/**
 * Creates a JSON-RPC error response
 */
export function createJsonRpcError(
  code: number,
  message: string
): JsonRpcError {
  return {
    jsonrpc: "2.0",
    error: { code, message },
    id: null,
  };
}

/**
 * Sends a JSON-RPC error response via ServerResponse
 */
export function sendJsonRpcError(
  res: ServerResponse,
  code: number,
  message: string
): void {
  if (!res.headersSent) {
    res.statusCode = code >= 400 && code < 600 ? code : 500;
    res.end(JSON.stringify(createJsonRpcError(code, message)));
  }
}

/**
 * Sends a JSON-RPC internal server error response
 */
export function sendInternalServerError(res: ServerResponse): void {
  sendJsonRpcError(res, -32603, "Internal server error");
}

/**
 * Creates a Web Response with JSON-RPC error
 */
export function createJsonRpcErrorResponse(
  code: number,
  message: string,
  status: number
): Response {
  return new Response(JSON.stringify(createJsonRpcError(code, message)), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Creates a method not allowed error response
 */
export function createMethodNotAllowedResponse(): Response {
  return createJsonRpcErrorResponse(-32000, "Method not allowed.", 405);
}
