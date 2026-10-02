const metadata = `icons: [{ src: "https://example.com/icon.png", mimeType: "image/png", sizes: ["48x48"], theme: "dark" }],
  tags: ["catalog", "example"], _meta: { custom: "kept" }`;

export const COMPONENT_METADATA_FILES: Record<string, string> = {
  "src/tools/metadata-tool.ts": `import type { ToolMetadata } from "xmcp";
export const metadata: ToolMetadata = { name: "metadata-tool", description: "Metadata example", ${metadata} };
export default function tool() { return "available"; }
`,
  "src/prompts/metadata-prompt.ts": `import type { PromptMetadata } from "xmcp";
export const metadata: PromptMetadata = { name: "metadata-prompt", title: "Metadata", description: "Metadata example", ${metadata} };
export default function prompt() { return "available"; }
`,
  "src/resources/(metadata)/info.ts": `import type { ResourceMetadata } from "xmcp";
export const metadata: ResourceMetadata = { name: "metadata-resource", ${metadata} };
export default function resource() { return "available"; }
`,
  "src/resources/(metadata)/items/[id]/index.ts": `import type { ResourceMetadata } from "xmcp";
export const metadata: ResourceMetadata = { name: "metadata-template", enabled: true, ${metadata} };
export default function resource() { return "available"; }
`,
  "src/tools/disabled-metadata.ts": `import type { ToolMetadata } from "xmcp";
export const metadata: ToolMetadata = { name: "disabled-metadata", description: "Disabled UI tool", enabled: false, _meta: { ui: {} } };
export default function tool() { throw new Error("Disabled tool ran"); }
`,
  "src/prompts/disabled-metadata.ts": `import type { PromptMetadata } from "xmcp";
export const metadata: PromptMetadata = { name: "disabled-metadata", title: "Disabled", description: "Disabled prompt", enabled: false };
export default function prompt() { throw new Error("Disabled prompt ran"); }
`,
  "src/resources/(metadata)/disabled.ts": `import type { ResourceMetadata } from "xmcp";
export const metadata: ResourceMetadata = { name: "disabled-metadata", enabled: false };
export default function resource() { throw new Error("Disabled resource ran"); }
`,
  "src/resources/(metadata)/disabled/[id]/index.ts": `import type { ResourceMetadata } from "xmcp";
export const metadata: ResourceMetadata = { name: "disabled-metadata-template", enabled: false };
export default function resource() { throw new Error("Disabled template ran"); }
`,
};
