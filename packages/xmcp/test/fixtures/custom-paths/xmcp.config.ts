import { type XmcpConfig } from "xmcp";

const config: XmcpConfig = {
  stdio: true,
  paths: {
    tools: "lib/tools",
    prompts: false,
    resources: false,
  },
  typescript: {
    skipTypeCheck: true,
  },
};

export default config;
