import { type XmcpConfig } from "xmcp";

const config: XmcpConfig = {
  http: {
    port: 3000,
    cors: {
      origin: "*",
      credentials: true,
    },
  },
};

export default config;
