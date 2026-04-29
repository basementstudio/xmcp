import { type XmcpConfig } from "xmcp";

const config: XmcpConfig = {
  http: true,
  stdio: true,
  paths: {
    tools: true,
    prompts: false,
    resources: false,
  },
  typescript: {
    skipTypeCheck: true,
  },
};

export default config;
