import { XmcpConfig } from "xmcp";

const port = 3004;
const baseUrl = `http://127.0.0.1:${port}`;
const providerPort = 4404;
const providerBaseUrl = `http://127.0.0.1:${providerPort}`;

const config: XmcpConfig = {
  http: {
    port,
  },
  paths: {
    prompts: false,
    resources: false,
  },
  oauth: {
    issuerUrl: providerBaseUrl,
    baseUrl,
  },
};

export default config;
