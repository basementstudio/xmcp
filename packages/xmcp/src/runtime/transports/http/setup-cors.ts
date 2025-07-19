import { Response } from "express";
import { CorsConfig } from "@/compiler/config/schemas";

export function setResponseCorsHeaders(cors: CorsConfig, res: Response) {
  // set cors headers dynamically
  if (cors.origin !== undefined)
    res.setHeader(
      "Access-Control-Allow-Origin",
      Array.isArray(cors.origin) ? cors.origin.join(",") : String(cors.origin)
    );
  if (cors.methods !== undefined)
    res.setHeader(
      "Access-Control-Allow-Methods",
      Array.isArray(cors.methods)
        ? cors.methods.join(",")
        : String(cors.methods)
    );
  if (cors.allowedHeaders !== undefined)
    res.setHeader(
      "Access-Control-Allow-Headers",
      Array.isArray(cors.allowedHeaders)
        ? cors.allowedHeaders.join(",")
        : String(cors.allowedHeaders)
    );
  if (cors.exposedHeaders !== undefined)
    res.setHeader(
      "Access-Control-Expose-Headers",
      Array.isArray(cors.exposedHeaders)
        ? cors.exposedHeaders.join(",")
        : String(cors.exposedHeaders)
    );
  if (typeof cors.credentials === "boolean")
    res.setHeader("Access-Control-Allow-Credentials", String(cors.credentials));
  if (typeof cors.maxAge === "number")
    res.setHeader("Access-Control-Max-Age", String(cors.maxAge));
}
