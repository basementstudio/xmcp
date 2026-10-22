import { createFileRoute } from "@tanstack/react-router";
import { xmcpHandler } from "../../.xmcp/adapter/index.js";

export const Route = createFileRoute("/mcp")({
  server: {
    handlers: {
      GET: ({ request }) => xmcpHandler(request),
      POST: ({ request }) => xmcpHandler(request),
      DELETE: ({ request }) => xmcpHandler(request),
    },
  },
});
