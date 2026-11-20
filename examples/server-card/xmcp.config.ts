import type { XmcpConfig } from "xmcp";

export default {
  http: true,
  paths: { prompts: false, resources: false },
  template: {
    name: "Bookshop",
    description: "Search the bookshop catalog and check stock.",
    icons: [{ src: "src/assets/icon.svg", mimeType: "image/svg+xml" }],
  },
} satisfies XmcpConfig;
