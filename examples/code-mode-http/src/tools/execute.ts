import { z } from "zod";
import type { ToolMetadata, ToolExtraArguments } from "xmcp";

export const schema = {
  toolName: z.string().describe("Name of the tool to execute"),
  args: z.record(z.any()).describe("Arguments to pass to the tool"),
};

export const metadata: ToolMetadata = {
  name: "execute",
  description:
    "Execute any available tool by name. Use the search tool first to discover tools and their required arguments.",
  annotations: { openWorldHint: true },
};

export default async function execute(
  { toolName, args }: { toolName: string; args: Record<string, unknown> },
  extra: ToolExtraArguments
) {
  return await extra.callTool(toolName, args);
}
