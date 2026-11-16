import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { xmcpHandler } from "../../.xmcp/adapter/index.js";
import { isBearer } from "../../src/env";

// Stateless: every MCP request must carry the bearer token.
function handle(request: Request) {
  if (
    !isBearer(request.headers.get("authorization"), process.env.MCP_API_KEY)
  ) {
    return new Response("Unauthorized", { status: 401 });
  }
  return xmcpHandler(request);
}

export function loader({ request }: LoaderFunctionArgs) {
  return handle(request);
}

export function action({ request }: ActionFunctionArgs) {
  return handle(request);
}
