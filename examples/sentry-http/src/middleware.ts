import * as Sentry from "@sentry/node";
import { sentryMiddleware } from "@xmcp-dev/sentry";

// Only manual MCP instrumentation is needed in this bundled example. An app
// using Sentry auto-instrumentation should initialize its SDK before startup.
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: Boolean(process.env.SENTRY_DSN),
  tracesSampleRate: 1,
  defaultIntegrations: false,
});
export const mcp = sentryMiddleware({ sentry: Sentry });
