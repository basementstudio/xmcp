import { type XmcpConfig } from "xmcp";

const config: XmcpConfig = {
  http: true,
  stdio: true,
  paths: {
    tools: false,
    prompts: false,
    resources: false,
  },
  typescript: {
    skipTypeCheck: true,
  },
};

export default config;
