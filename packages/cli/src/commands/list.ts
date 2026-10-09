import { withClient } from "xmcp/client";
import type { DiscoveryOptions } from "../utils/discovery-options.js";
import { resolveDiscoveryTarget } from "../utils/discovery-target.js";

export async function runList(options: DiscoveryOptions) {
  return withClient(await resolveDiscoveryTarget(options), async (client) => {
    const capabilities = client.getServerCapabilities();
    // SDK list methods collect every page. Do not call unsupported methods:
    // an absent capability is an empty catalog, not a server error.
    const [tools, prompts, resources, templates] = await Promise.all([
      capabilities?.tools ? client.listTools() : { tools: [] },
      capabilities?.prompts ? client.listPrompts() : { prompts: [] },
      capabilities?.resources ? client.listResources() : { resources: [] },
      capabilities?.resources
        ? client.listResourceTemplates()
        : { resourceTemplates: [] },
    ]);
    return {
      tools: tools.tools,
      prompts: prompts.prompts,
      resources: resources.resources,
      resourceTemplates: templates.resourceTemplates,
    };
  });
}

export function formatCatalog(
  result: Awaited<ReturnType<typeof runList>>
): string {
  const sections: [
    string,
    {
      name: string;
      description?: string;
      uri?: string;
      uriTemplate?: string;
    }[],
  ][] = [
    ["Tools", result.tools],
    ["Prompts", result.prompts],
    ["Resources", result.resources],
    ["Resource templates", result.resourceTemplates],
  ];
  return sections
    .map(([title, items]) =>
      [
        `${title} (${items.length})`,
        ...items.map(
          (item) =>
            `  ${item.name}${item.uri || item.uriTemplate ? ` (${item.uri ?? item.uriTemplate})` : ""}${item.description ? `: ${item.description}` : ""}`
        ),
      ].join("\n")
    )
    .join("\n\n");
}
