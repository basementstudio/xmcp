import { Request } from "express";

export function buildBaseUrl(req: Request): string {
  const protocol = req.headers["x-forwarded-proto"] || req.protocol;
  const host = req.headers["x-forwarded-host"] || req.get("host");
  return `${protocol}://${host}`;
}

export function buildResourceMetadataUrl(req: Request): string {
  return `${buildBaseUrl(req)}/.well-known/oauth-protected-resource`;
}
