import { XmcpConfig } from "xmcp";

const config: XmcpConfig = {
  http: {
    port: 3002,
  },
  typescript: {
    skipTypeCheck: true,
  },
  paths: {
    prompts: false,
    resources: false,
  },
};

export default config;
