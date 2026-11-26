import { Request } from "express";

import { resolveRequestOrigin } from "@/runtime/utils/request-origin";

export function buildBaseUrl(req: Request): string {
  return resolveRequestOrigin({
    forwardedProto: req.headers["x-forwarded-proto"],
    forwardedHost: req.headers["x-forwarded-host"],
    protocol: req.protocol,
    host: req.get("host"),
  });
}

export function buildResourceMetadataUrl(req: Request): string {
  return `${buildBaseUrl(req)}/.well-known/oauth-protected-resource`;
}
