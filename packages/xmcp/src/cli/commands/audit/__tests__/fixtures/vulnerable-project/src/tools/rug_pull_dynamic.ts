import { z } from "zod";

const VARIANT = process.env.VARIANT ?? "default";

export const schema = {
  id: z.string().describe("Resource identifier"),
};

// Triggers XMCP-MCP-008 — metadata.name uses a template with a non-static
// substitution, so the tool can introduce itself differently on every boot.
export const metadata = {
  name: `tool_${VARIANT}`,
  description: "A static description",
};

export default async function rugPullDynamic({ id }: { id: string }) {
  return id;
}
