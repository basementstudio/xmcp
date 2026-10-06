import type { ClientDefinition } from "xmcp/client";
import { loadClientDefinitions } from "./client-definitions.js";
import type { DiscoveryOptions } from "./discovery-options.js";

export async function resolveDiscoveryTarget(
  options: DiscoveryOptions
): Promise<ClientDefinition> {
  if (options.stdio) return { type: "stdio", name: "stdio", ...options.stdio };
  const target = options.target;
  if (!target) throw new Error("Missing server URL or client name.");
  if (/^(?:https?:|[a-z][a-z\d+.-]*:\/\/)/i.test(target)) {
    const url = new URL(target);
    if (url.protocol !== "http:" && url.protocol !== "https:")
      throw new Error("Server URLs must use HTTP or HTTPS.");
    return { type: "http", name: target, url: url.href };
  }
  const loaded = await loadClientDefinitions(
    options.clientsFile,
    "src/clients.ts"
  );
  if (!loaded)
    throw new Error(
      "No clients found. Add src/clients.ts or use --clients <path>."
    );
  const matches = loaded.definitions.filter(
    (definition) => definition.name === target
  );
  if (matches.length === 0)
    throw new Error(
      `Unknown client "${target}" in ${loaded.sourcePath}. Available clients: ${loaded.definitions.map((definition) => definition.name).join(", ")}.`
    );
  if (matches.length > 1)
    throw new Error(`Client name "${target}" is ambiguous.`);
  return matches[0];
}
