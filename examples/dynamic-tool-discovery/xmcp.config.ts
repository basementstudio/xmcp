import { XmcpConfig } from "xmcp";

const config: XmcpConfig = {
  http: true,
  typescript: {
    skipTypeCheck: true,
  },
  tools: {
    // Re-enable the experimental tool (which has enabled: false in its metadata)
    enable: ["experimental"],
  },
};

export default config;
