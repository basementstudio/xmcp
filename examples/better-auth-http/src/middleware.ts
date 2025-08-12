import { betterAuthProvider } from "@xmcp-dev/better-auth";
import { Pool } from "pg";

export default betterAuthProvider({
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),
  baseURL: process.env.BETTER_AUTH_BASE_URL || "http://127.0.0.1:3002",
  secret: process.env.BETTER_AUTH_SECRET || "super-secret-key",
  providers: {
    emailAndPassword: {
      enabled: true,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
  },
});
