import type { ToolMetadata } from "xmcp";
import { getManagementClient } from "@xmcp-dev/auth0";

export const metadata: ToolMetadata = {
  name: "list_api_scopes",
  description: "List all available scopes/permissions for this API",
};

interface ResourceServerScope {
  value: string;
  description?: string;
}

interface ResourceServer {
  identifier?: string;
  scopes?: ResourceServerScope[];
}

export default async function listApiScopes() {
  const client = getManagementClient();

  try {
    const { data: servers } = await client.resourceServers.list();

    // Find scopes for this API (localhost)
    const apiServer = (servers as ResourceServer[]).find(
      (s: ResourceServer) =>
        s.identifier?.includes("localhost") ||
        s.identifier?.includes("127.0.0.1")
    );

    if (!apiServer?.scopes?.length) {
      return "No scopes defined for this API";
    }

    const scopeList = apiServer.scopes
      .map((s: ResourceServerScope) => `- ${s.value}${s.description ? `: ${s.description}` : ""}`)
      .join("\n");

    return `Available scopes:\n${scopeList}`;
  } catch (error) {
    return error instanceof Error ? error.message : "Failed to list API scopes";
  }
}
