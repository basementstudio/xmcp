import { CorsConfig } from "@/compiler/config";
import { Request, Response, NextFunction, RequestHandler } from "express";
import { buildCorsHeaders } from "./headers";

/**
 * Sets CORS headers on the response based on the provided configuration
 */
export function setHeaders(
  res: Response,
  config: CorsConfig,
  origin?: string
): void {
  const headers = buildCorsHeaders(config, origin);
  for (const [key, value] of Object.entries(headers)) {
    res.setHeader(key, value);
  }
}

export function cors(config: CorsConfig): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const requestOrigin = req.headers.origin;

    setHeaders(res, config, requestOrigin);

    if (req.method === "OPTIONS") {
      res.status(204).end();
      return;
    }

    next();
  };
}
