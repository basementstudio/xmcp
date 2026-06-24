import { XmcpConfig } from "xmcp";

const port = 3005;

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
