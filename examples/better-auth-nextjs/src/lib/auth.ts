import { betterAuth } from "better-auth";
import { mcp } from "better-auth/plugins";
import { Pool } from "pg";

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),
  baseURL: "http://localhost:3000",
  plugins: [
    mcp({
      loginPage: "/login",
    }),
  ],
  emailAndPassword: {
    enabled: true,
  },
});
