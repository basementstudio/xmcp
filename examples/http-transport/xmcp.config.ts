import { XmcpConfig } from "xmcp";

const config: XmcpConfig = {
  http: true,
  components: {
    exclude: { tags: ["internal"] },
  },
  typescript: {
    skipTypeCheck: true,
  },
};

export default config;
