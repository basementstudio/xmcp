// Standard Agent Skills served through the MCP Skills extension. The files
// cover extra frontmatter fields, multibyte text, a path that needs URI
// encoding, and content that is not valid UTF-8.
export const SKILLS_EXTENSION = "io.modelcontextprotocol/skills";

export const SKILL_FRONTMATTER = {
  name: "fixture-skill",
  description: "Exercise the Skills extension in the conformance fixture",
  license: "MIT",
  metadata: { author: "xmcp", version: "1.0" },
};

export const SKILL_URIS = [
  "skill://fixture-skill/SKILL.md",
  "skill://fixture-skill/assets/pixel.bin",
  "skill://fixture-skill/references/caf%C3%A9%20guide.md",
  "skill://second-skill/SKILL.md",
];

export const SKILLS_FILES: Record<string, string | Uint8Array> = {
  "src/skills/fixture-skill/SKILL.md": `---
name: fixture-skill
description: Exercise the Skills extension in the conformance fixture
license: MIT
metadata:
  author: xmcp
  version: "1.0"
---

# Fixture skill

Follow \`references/café guide.md\`.
`,
  "src/skills/fixture-skill/references/café guide.md":
    "# Guide\r\n\r\nUse the café ☕ template.\n",
  "src/skills/fixture-skill/assets/pixel.bin": Uint8Array.from([
    0x89, 0x50, 0x4e, 0x47, 0x00, 0xff, 0xfe,
  ]),
  "src/skills/second-skill/SKILL.md": `---
name: second-skill
description: A skill without supporting files
---
`,
  // Excluded by the fixture's component visibility rules.
  "src/skills/visibility-by-name/SKILL.md": `---
name: visibility-by-name
description: A skill hidden by components.exclude.names
---
`,
};
