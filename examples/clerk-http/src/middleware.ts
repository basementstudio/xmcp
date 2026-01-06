import { clerkProvider } from "@xmcp-dev/clerk";

export default clerkProvider({
  secretKey: process.env.CLERK_SECRET_KEY!,
  clerkDomain: process.env.CLERK_DOMAIN!,
  baseURL: process.env.BASE_URL || "http://127.0.0.1:3002",
  scopes: ["profile", "email"],
});

