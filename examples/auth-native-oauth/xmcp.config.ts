import { XmcpConfig } from "xmcp";

const port = 3004;

const config: XmcpConfig = {
  http: {
    port,
  },
  paths: {
    prompts: false,
    resources: false,
  },
};

export default config;
