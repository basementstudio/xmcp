import { descopeProvider } from "@xmcp-dev/descope";

export default descopeProvider({
  projectId: process.env.DESCOPE_PROJECT_ID!,
  audience: process.env.DESCOPE_AUDIENCE!,
  baseURL: process.env.BASE_URL!,
});
