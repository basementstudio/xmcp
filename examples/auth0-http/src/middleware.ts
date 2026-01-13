import { auth0Provider } from "@xmcp-dev/auth0";

export default auth0Provider({
  domain: process.env.AUTH0_DOMAIN!,
  audience: process.env.AUTH0_AUDIENCE!,
  baseURL: process.env.BASE_URL!,
  management: {
    clientId: process.env.AUTH0_MGMT_CLIENT_ID!,
    clientSecret: process.env.AUTH0_MGMT_CLIENT_SECRET!,
  },
});
