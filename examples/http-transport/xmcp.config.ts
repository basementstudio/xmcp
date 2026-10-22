import { XmcpConfig } from "xmcp";

const config: XmcpConfig = {
  http: {
    // This example uses a fixed component roster and does not need subscriptions.
    maxSubscriptions: 0,
  },
  components: {
    exclude: { tags: ["internal"] },
  },
  typescript: {
    skipTypeCheck: true,
  },
};

export default config;
