import { XmcpConfig } from "xmcp";

const config: XmcpConfig = {
  http: true,
  paths: {
    prompts: false,
    resources: false,
  },
  observability: true,
  typescript: {
    skipTypeCheck: true,
  },
};

export default config;
