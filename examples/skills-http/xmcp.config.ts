import { XmcpConfig } from "xmcp";

const config: XmcpConfig = {
  http: true,
  paths: {
    prompts: false,
    resources: false,
    // Skills are read from src/skills by default.
  },
};

export default config;
