import { betterAuth } from "better-auth";
import { jwt } from "better-auth/plugins";
import { mcp } from "@better-auth/mcp";
import { Pool } from "pg";

export const mcpResource = "http://localhost:3000/mcp";

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),
  baseURL: "http://localhost:3000",
  disabledPaths: ["/token"],
  plugins: [
    jwt({ disableSettingJwtHeader: true }),
    mcp({
      loginPage: "/login",
      consentPage: "/consent",
      resource: mcpResource,
      allowDynamicClientRegistration: true,
      allowUnauthenticatedClientRegistration: true,
      clientRegistrationDefaultApplicationType: "infer",
    }),
  ],
  emailAndPassword: {
    enabled: true,
  },
});
