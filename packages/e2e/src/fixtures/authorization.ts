// One policy, exported from src/middleware.ts, gates every operation on HTTP and
// STDIO. Only components tagged for this group are affected.
export const AUTHORIZATION_FILES = {
  "src/authorization-policy.ts": `import type { McpAuthorize } from "xmcp";
export const authorize: McpAuthorize = (ctx, component, operation) => {
  if (operation === "call" && ctx.method !== "tools/call") throw new Error("Unexpected operation");
  const tags = component.metadata.tags ?? [];
  if (tags.includes("authz-deny")) return false;
  if (tags.includes("authz-no-call")) return operation !== "call";
  return true;
};
`,
  "src/tools/authz-hidden.ts": `import { z } from "zod";
export const schema = { n: z.number() };
export const metadata = { name: "authz-hidden", description: "Denied tool", tags: ["authz-deny"] };
export default function hidden() { throw new Error("Denied tool ran"); }
`,
  "src/tools/authz-listed.ts": `export const metadata = { name: "authz-listed", description: "Discoverable but not callable", tags: ["authz-no-call"] };
export default function listed() { throw new Error("Denied tool ran"); }
`,
  "src/prompts/authz-hidden.ts": `import { completable } from "xmcp";
import { z } from "zod";
export const metadata = { name: "authz-hidden", tags: ["authz-deny"] };
export const schema = { value: completable(z.string(), () => { throw new Error("Denied completion ran"); }) };
export default function hidden() { throw new Error("Denied prompt ran"); }
`,
  "src/resources/(authz)/hidden.ts": `export const metadata = { name: "authz-hidden-resource", tags: ["authz-deny"] };
export default function hidden() { throw new Error("Denied resource ran"); }
`,
  "src/resources/(authz)/secret/[id]/index.ts": `import type { ResourceCompletions } from "xmcp";
export const metadata = { name: "authz-secret", tags: ["authz-deny"] };
export const complete: ResourceCompletions = { id: () => { throw new Error("Denied completion ran"); } };
export default function secret() { throw new Error("Denied template ran"); }
`,
};
