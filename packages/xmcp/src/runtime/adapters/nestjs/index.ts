import { Request, Response } from "express";
import { createServer } from "@/runtime/utils/server";
import { StatelessHttpServerTransport } from "@/runtime/transports/http/stateless-streamable-http";
import { setResponseCorsHeaders } from "@/runtime/transports/http/setup-cors";
import { httpRequestContextProvider } from "@/runtime/contexts/http-request-context";
import { randomUUID } from "node:crypto";

// cors config
// @ts-expect-error: injected by compiler
const corsOrigin = HTTP_CORS_ORIGIN as string;
// @ts-expect-error: injected by compiler
const corsMethods = HTTP_CORS_METHODS as string;
// @ts-expect-error: injected by compiler
const corsAllowedHeaders = HTTP_CORS_ALLOWED_HEADERS as string;
// @ts-expect-error: injected by compiler
const corsExposedHeaders = HTTP_CORS_EXPOSED_HEADERS as string;
// @ts-expect-error: injected by compiler
const corsCredentials = HTTP_CORS_CREDENTIALS as boolean;
// @ts-expect-error: injected by compiler
const corsMaxAge = HTTP_CORS_MAX_AGE as number;

// @ts-expect-error: injected by compiler
const debug = HTTP_DEBUG as boolean;
// @ts-expect-error: injected by compiler
const bodySizeLimit = HTTP_BODY_SIZE_LIMIT as string;

export async function xmcpHandler(req: Request, res: Response) {
  return new Promise((resolve) => {
    const id = randomUUID();
    httpRequestContextProvider({ id, headers: req.headers }, async () => {
      try {
        setResponseCorsHeaders(
          {
            origin: corsOrigin,
            methods: corsMethods,
            allowedHeaders: corsAllowedHeaders,
            exposedHeaders: corsExposedHeaders,
            credentials: corsCredentials,
            maxAge: corsMaxAge,
          },
          res
        );

        const server = await createServer();
        const transport = new StatelessHttpServerTransport(
          debug,
          bodySizeLimit || "10mb"
        );

        // cleanup when request/connection closes
        res.on("close", () => {
          transport.close();
          server.close();
        });

        await server.connect(transport);

        await transport.handleRequest(req, res, req.body).then(() => {
          resolve(res);
        });
      } catch (error) {
        console.error("[HTTP-server] Error handling MCP request:", error);
        if (!res.headersSent) {
          res.status(500).json({
            jsonrpc: "2.0",
            error: {
              code: -32603,
              message: "Internal server error",
            },
            id: null,
          });
        }
      }
    });
  });
}

// NestJS specific exports for easier integration
export class XmcpController {
  static async handleMcpRequest(req: Request, res: Response) {
    return xmcpHandler(req, res);
  }
}

// Decorator for easy NestJS integration
export function XmcpEndpoint() {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (req: Request, res: Response) {
      return xmcpHandler(req, res);
    };
    return descriptor;
  };
}

// Authentication support
export interface AuthConfig {
  verifyToken: (req: Request, bearerToken?: string) => Promise<any>;
  required?: boolean;
  requiredScopes?: string[];
}

export function withAuth(
  handler: (req: Request, res: Response) => Promise<void>,
  config: AuthConfig
): (req: Request, res: Response) => Promise<void> {
  return async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    
    if (config.required && !authHeader) {
      res.status(401).json({
        jsonrpc: "2.0",
        error: {
          code: -32601,
          message: "Authentication required",
        },
        id: null,
      });
      return;
    }
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      try {
        const user = await config.verifyToken(req, token);
        (req as any).user = user;
        
        // Check scopes if required
        if (config.requiredScopes && user.scopes) {
          const hasRequiredScopes = config.requiredScopes.every(scope => 
            user.scopes.includes(scope)
          );
          if (!hasRequiredScopes) {
            res.status(403).json({
              jsonrpc: "2.0",
              error: {
                code: -32601,
                message: "Insufficient permissions",
              },
              id: null,
            });
            return;
          }
        }
      } catch (error) {
        res.status(401).json({
          jsonrpc: "2.0",
          error: {
            code: -32601,
            message: "Invalid token",
          },
          id: null,
        });
        return;
      }
    }
    
    return handler(req, res);
  };
}

// NestJS-specific utilities
export function createXmcpMiddleware(): any {
  return (req: Request, res: Response, next: any) => {
    // Add XMCP context to request
    (req as any).xmcp = {
      sessionId: req.headers['mcp-session-id'] as string || 'unknown',
      timestamp: Date.now(),
    };
    next();
  };
}

// Enhanced error handling
export class XmcpException extends Error {
  constructor(
    message: string,
    public readonly code: number = -32603,
    public readonly statusCode: number = 500
  ) {
    super(message);
    this.name = 'XmcpException';
  }
}
