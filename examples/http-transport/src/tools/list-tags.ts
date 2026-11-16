import { type ToolMetadata } from "xmcp";

export const metadata: ToolMetadata = {
  name: "list-tags",
  description: "List the available ticket tags",
};

// structuredContent can be any JSON value. Clients on protocol revisions
// before 2026-07-28 receive arrays wrapped as { "result": [...] }.
export default async function listTags() {
  return { structuredContent: ["billing", "support", "sales"] };
}
