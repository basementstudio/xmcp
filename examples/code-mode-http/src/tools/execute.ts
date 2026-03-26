import { z } from "zod";
import type { ToolMetadata, ToolExtraArguments } from "xmcp";

export const schema = {
  toolName: z.string().describe("Name of the tool to execute"),
  args: z
    .string()
    .describe(
      'JSON string of arguments to pass to the tool (e.g. \'{"name": "World"}\')'
    ),
};

export const metadata: ToolMetadata = {
  name: "execute",
  description:
    "Execute any available tool by name. Use the search tool first to discover tools and their required arguments. Pass args as a JSON string.",
  annotations: { openWorldHint: true },
};

export default async function execute(
  { toolName, args }: { toolName: string; args: string },
  extra: ToolExtraArguments
) {
  let parsedArgs;
  try {
    parsedArgs = JSON.parse(args);
  } catch {
    return { content: [{ type: "text", text: "Invalid JSON in args" }], isError: true };
  }
  return await extra.callTool(toolName, parsedArgs);
}
