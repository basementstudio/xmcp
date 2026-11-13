import type { ToolMetadata } from "xmcp";

import { allowedTools, withPaper } from "../paper";

export const metadata: ToolMetadata = {
  name: "list-paper-tools",
  description:
    "Inspect Paper's available tools, input schemas, instructions, and local allowlist.",
  annotations: { readOnlyHint: true, openWorldHint: true },
};

export default async function listPaperTools() {
  return withPaper(async (client) => {
    const tools = [];
    let cursor: string | undefined;
    const allowed = allowedTools();
    do {
      const page = await client.listTools({ cursor });
      tools.push(
        ...page.tools.map((tool) => ({
          ...tool,
          allowed: allowed.has(tool.name),
        }))
      );
      cursor = page.nextCursor;
    } while (cursor);
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            instructions: client.getInstructions(),
            tools,
          }),
        },
      ],
    };
  });
}
