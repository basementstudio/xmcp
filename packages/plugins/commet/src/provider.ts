import type { RequestHandler } from "express";
import type { Middleware } from "xmcp";
import { Commet } from "@commet/node";
import { providerCommetContext } from "./context.js";
import type { CommetProviderConfig } from "./types.js";

export function commetProvider(config: CommetProviderConfig): Middleware {
  if (!config.apiKey) {
    throw new Error("[Commet] Missing required config: apiKey");
  }

  const client = new Commet({
    apiKey: config.apiKey,
    environment: config.environment,
  });

  const headerName = config.customerHeader ?? "customer-key";

  providerCommetContext({ client, customerId: null }, () => {});

  const middleware: RequestHandler = (req, _res, next) => {
    const rawHeader = req.headers[headerName];
    const customerId =
      typeof rawHeader === "string" && rawHeader.length > 0
        ? rawHeader
        : null;
    providerCommetContext({ client, customerId }, () => {
      next();
    });
  };

  return middleware;
}
