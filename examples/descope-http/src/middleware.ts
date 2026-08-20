import { descopeProvider } from "@xmcp-dev/descope";

export default descopeProvider({
  issuerURL: process.env.DESCOPE_ISSUER_URL!,
  baseURL: process.env.BASE_URL!,
  projectId: process.env.DESCOPE_PROJECT_ID,
});
