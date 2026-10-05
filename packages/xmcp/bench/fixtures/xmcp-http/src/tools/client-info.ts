import type { ToolExtraArguments, ToolMetadata } from "xmcp";

export const metadata: ToolMetadata = {
  name: "client-info",
  description: "Return the current request's MCP client name",
};

export default (_args: unknown, extra: ToolExtraArguments) =>
  extra.clientInfo?.name ?? "unknown-client";
