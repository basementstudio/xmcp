import { XmcpConfig } from "xmcp";

const config: XmcpConfig = {
  http: true,
  experimental: {
    adapter: "express",
  },
};

export default config;
