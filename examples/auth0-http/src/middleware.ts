import { auth0Provider } from "@xmcp-dev/auth0";

export default auth0Provider({
  domain: process.env.DOMAIN!,
  audience: process.env.AUDIENCE!,
  baseURL: process.env.BASE_URL!,
  clientId: process.env.CLIENT_ID!,
  clientSecret: process.env.CLIENT_SECRET!,
});
