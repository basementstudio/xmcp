export const VISIBILITY_CONFIG = {
  exclude: { tags: ["visibility-hidden"], names: ["visibility-by-name"] },
};

export const COMPONENT_VISIBILITY_FILES: Record<string, string> = {
  "src/tools/visibility-ui.ts": `export const metadata = { name: "visibility-ui", tags: ["visibility-public"], _meta: { ui: {} } };
export default function widget() { return "<p>Visible widget</p>"; }
`,
  "src/tools/visibility-hidden.ts": `export const metadata = { name: "visibility-hidden", tags: ["visibility-hidden"], _meta: { ui: {} } };
export default function hidden() { throw new Error("Excluded UI tool ran"); }
`,
  "src/tools/visibility-alias.ts": `export const metadata = { name: "visibility-by-name", tags: ["visibility-public"] };
export default function hidden() { throw new Error("Excluded named tool ran"); }
`,
  "src/prompts/visibility-public.ts": `export const metadata = { name: "visibility-public", tags: ["visibility-public"] };
export default function prompt() { return "Visible prompt"; }
`,
  "src/prompts/visibility-hidden.ts": `export const metadata = { name: "visibility-hidden", tags: ["visibility-hidden"] };
export default function prompt() { throw new Error("Excluded prompt ran"); }
`,
  "src/prompts/visibility-alias.ts": `export const metadata = { name: "visibility-by-name", tags: ["visibility-public"] };
export default function prompt() { throw new Error("Excluded named prompt ran"); }
`,
  "src/resources/(visibility)/public.ts": `export const metadata = { name: "visibility-public", tags: ["visibility-public"] };
export default function resource() { return "Visible resource"; }
`,
  "src/resources/(visibility)/hidden.ts": `export const metadata = { name: "visibility-hidden", tags: ["visibility-hidden"] };
export default function resource() { throw new Error("Excluded resource ran"); }
`,
  "src/resources/(visibility)/alias.ts": `export const metadata = { name: "visibility-by-name", tags: ["visibility-public"] };
export default function resource() { throw new Error("Excluded named resource ran"); }
`,
  "src/resources/(visibility)/public-items/[id]/index.ts": `export const metadata = { name: "visibility-public-template", tags: ["visibility-public"] };
export default function resource() { return "Visible template"; }
`,
  "src/resources/(visibility)/hidden-items/[id]/index.ts": `export const metadata = { name: "visibility-hidden-template", tags: ["visibility-hidden"] };
export const complete = { id: () => { throw new Error("Excluded completion ran"); } };
export default function resource() { throw new Error("Excluded template ran"); }
`,
};
