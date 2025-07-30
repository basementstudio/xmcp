import { Pool } from "pg";
import { betterAuthProvider } from "@xmcp-dev/better-auth";

const auth = {
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),
  baseURL: process.env.BETTER_AUTH_BASE_URL || "http://127.0.0.1:3002",
  secret: process.env.BETTER_AUTH_SECRET || "super-secret-key",
  emailAndPassword: {
    enabled: true,
  },
};

export default betterAuthProvider(auth);
