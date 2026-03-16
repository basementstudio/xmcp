import { XmcpConfig } from "xmcp";

const config: XmcpConfig = {
  http: true,
  paths: {
    prompts: false,
    resources: false,
  },
  observability: {
    enabled: true,
    stderr: true,
    color: "off",
  },
  typescript: {
    skipTypeCheck: true,
  },
};

export default config;
