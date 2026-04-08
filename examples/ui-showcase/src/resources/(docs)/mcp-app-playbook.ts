import { type ResourceMetadata } from "xmcp";

export const metadata: ResourceMetadata = {
  name: "mcp-app-playbook",
  title: "MCP App Playbook",
  description:
    "Small reference document used by the ui showcase resource/composer demo.",
};

const playbook = {
  title: "MCP App Playbook",
  recommendedFlows: [
    "Call tools through the host bridge instead of opening a second transport in the UI.",
    "Use host context to adapt view modes, safe areas, and theme tokens.",
    "Read resources for structured docs or seed content before asking the model to act on them.",
    "Promote schema-driven apps when the UI is mostly declarative and predictable.",
  ],
  notes: [
    "PiP and fullscreen are host-granted, not guaranteed.",
    "Model context updates should be small, specific, and user-visible.",
    "Resources are better than hardcoded strings when the host should be able to inspect or cache content.",
  ],
};

export default function handler() {
  return {
    contents: [
      {
        mimeType: "application/json",
        text: JSON.stringify(playbook, null, 2),
      },
      {
        mimeType: "text/markdown",
        text: `# ${playbook.title}

## Recommended Flows
- ${playbook.recommendedFlows.join("\n- ")}

## Notes
- ${playbook.notes.join("\n- ")}
`,
      },
    ],
  };
}
