import { CorsConfig } from "@/compiler/config";
import { Request, Response, NextFunction, RequestHandler } from "express";

/**
 * Sets CORS headers on the response based on the provided configuration
 */
export function setHeaders(
  res: Response,
  config: CorsConfig,
  origin?: string
): void {
  if (config.origin !== undefined) {
    if (config.origin === true) {
      if (origin) {
        res.setHeader("Access-Control-Allow-Origin", origin);
      }
    } else if (config.origin !== false) {
      res.setHeader(
        "Access-Control-Allow-Origin",
        Array.isArray(config.origin)
          ? config.origin.join(",")
          : String(config.origin)
      );
    }
  }

  if (config.methods !== undefined) {
    res.setHeader(
      "Access-Control-Allow-Methods",
      Array.isArray(config.methods)
        ? config.methods.join(",")
        : String(config.methods)
    );
  }

  if (config.allowedHeaders !== undefined) {
    res.setHeader(
      "Access-Control-Allow-Headers",
      Array.isArray(config.allowedHeaders)
        ? config.allowedHeaders.join(",")
        : String(config.allowedHeaders)
    );
  }

  if (config.exposedHeaders !== undefined) {
    res.setHeader(
      "Access-Control-Expose-Headers",
      Array.isArray(config.exposedHeaders)
        ? config.exposedHeaders.join(",")
        : String(config.exposedHeaders)
    );
  }

  if (typeof config.credentials === "boolean") {
    res.setHeader(
      "Access-Control-Allow-Credentials",
      String(config.credentials)
    );
  }

  if (typeof config.maxAge === "number") {
    res.setHeader("Access-Control-Max-Age", String(config.maxAge));
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
