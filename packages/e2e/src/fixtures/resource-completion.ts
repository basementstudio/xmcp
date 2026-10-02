export const RESOURCE_COMPLETION_FILES = {
  "src/resources/(team)/members/[department]/[name]/index.ts": `import type { ResourceCompletions } from "xmcp";
export const metadata = { name: "completion-members", description: "Team member profiles" };
export const complete: ResourceCompletions = {
  department: (value) => ["engineering", "sales"].filter((item) => item.startsWith(value)),
  name: async (value, context) => {
    if (value === "bulk") return Array.from({ length: 105 }, (_, index) => "user-" + index);
    const names = context?.arguments?.department === "engineering" ? ["Ada", "Alan"] : ["Sam"];
    return names.filter((item) => item.startsWith(value));
  },
};
export default function member({ department, name }: { department: string; name: string }) { return department + ":" + name; }
`,
  "src/prompts/resource-completion.ts": `import { completable } from "xmcp";
import { z } from "zod";
export const schema = { name: completable(z.string(), async (value) => ["Ada", "Alan"].filter((name) => name.startsWith(value))) };
export default function greeting({ name }: { name: string }) { return "Hello, " + name; }
`,
};
