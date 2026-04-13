import { XmcpConfig } from "xmcp";

const port = 3004;
const baseUrl = `http://127.0.0.1:${port}`;

const config: XmcpConfig = {
  http: {
    port,
  },
  paths: {
    prompts: false,
    resources: false,
  },
  experimental: {
    oauth: {
      issuerUrl: `${baseUrl}/mock-oauth`,
      baseUrl,
      endpoints: {
        authorizationUrl: `${baseUrl}/mock-oauth/authorize`,
        tokenUrl: `${baseUrl}/mock-oauth/token`,
        registerUrl: `${baseUrl}/mock-oauth/register`,
        introspectionUrl: `${baseUrl}/mock-oauth/introspect`,
        revocationUrl: `${baseUrl}/mock-oauth/revoke`,
      },
    },
  },
};

export default config;
