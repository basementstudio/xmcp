import { XmcpConfig } from "xmcp";

const config: XmcpConfig = {
  http: true,
  template: {
    name: "Custom xmcp server",
    description: "You can modify this description in the xmcp.config.ts file.",

    // Icons shown in MCP clients (e.g. Claude Connectors).
    // When omitted, the default xmcp logo is used.
    icons: [{ src: "https://xmcp.dev/xmcp-logo.svg", mimeType: "image/svg+xml" }],

    // Custom home page - can be inline HTML or a file path
    // Option 1: Inline HTML string
    // homePage: "<html><body><h1>Welcome to my MCP server!</h1></body></html>",

    // Option 2: Path to an HTML file (relative to project root)
    // homePage: "src/home.html",
  },
};

export default config;
