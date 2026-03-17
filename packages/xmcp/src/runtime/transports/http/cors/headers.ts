import type { CorsConfig } from "@/compiler/config";

export function buildCorsHeaders(
  config: CorsConfig,
  requestOrigin?: string | null
): Record<string, string> {
  const headers: Record<string, string> = {};

  if (config.origin !== undefined) {
    if (config.origin === true) {
      if (requestOrigin) {
        headers["Access-Control-Allow-Origin"] = requestOrigin;
      }
    } else if (config.origin !== false) {
      if (Array.isArray(config.origin)) {
        const matchedOrigin =
          requestOrigin && config.origin.includes(requestOrigin)
            ? requestOrigin
            : config.origin[0] || "*";
        headers["Access-Control-Allow-Origin"] = matchedOrigin;
      } else {
        headers["Access-Control-Allow-Origin"] = String(config.origin);
      }
    }
  }

  if (config.methods !== undefined) {
    headers["Access-Control-Allow-Methods"] = Array.isArray(config.methods)
      ? config.methods.join(",")
      : String(config.methods);
  }

  if (config.allowedHeaders !== undefined) {
    headers["Access-Control-Allow-Headers"] = Array.isArray(
      config.allowedHeaders
    )
      ? config.allowedHeaders.join(",")
      : String(config.allowedHeaders);
  }

  if (config.exposedHeaders !== undefined) {
    headers["Access-Control-Expose-Headers"] = Array.isArray(
      config.exposedHeaders
    )
      ? config.exposedHeaders.join(",")
      : String(config.exposedHeaders);
  }

  if (typeof config.credentials === "boolean") {
    headers["Access-Control-Allow-Credentials"] = String(config.credentials);
  }

  if (typeof config.maxAge === "number") {
    headers["Access-Control-Max-Age"] = String(config.maxAge);
  }

  return headers;
}
