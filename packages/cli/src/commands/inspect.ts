import { withClient } from "xmcp/client";
import type { DiscoveryOptions } from "../utils/discovery-options.js";
import { resolveDiscoveryTarget } from "../utils/discovery-target.js";

export async function runInspect(options: DiscoveryOptions) {
  return withClient(await resolveDiscoveryTarget(options), (client) => ({
    serverInfo: client.getServerVersion() ?? null,
    protocolVersion: client.getNegotiatedProtocolVersion() ?? null,
    capabilities: client.getServerCapabilities() ?? {},
    instructions: client.getInstructions() ?? null,
  }));
}

export function formatInspection(
  result: Awaited<ReturnType<typeof runInspect>>
): string {
  return [
    `Server: ${result.serverInfo?.name ?? "unknown"} (${result.serverInfo?.version ?? "unknown"})`,
    `Protocol: ${result.protocolVersion ?? "unknown"}`,
    `Capabilities: ${JSON.stringify(result.capabilities, null, 2)}`,
    ...(result.instructions ? [`Instructions: ${result.instructions}`] : []),
  ].join("\n");
}
