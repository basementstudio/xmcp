import { XmcpConfig } from "xmcp";

const config: XmcpConfig = {
  // The host checks types after xmcp generates the adapter.
  typescript: { skipTypeCheck: true },
  http: true,
  experimental: {
    adapter: "express",
  },
};

export default config;
