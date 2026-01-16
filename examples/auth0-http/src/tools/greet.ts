import { z } from "zod";
import type { InferSchema, ToolMetadata } from "xmcp";
import { getAuthInfo } from "@xmcp-dev/auth0";

// Define the schema for tool parameters
export const schema = {
  name: z.string().optional().describe("The name of the user to greet"),
};

// Define tool metadata
export const metadata: ToolMetadata = {
  name: "greet",
  description: "Greet the user with their Auth0 identity",
};

// Tool implementation with scope-based authorization
export default function greet({ name }: InferSchema<typeof schema>): string {
  const authInfo = getAuthInfo();
  const displayName = authInfo.user.name ?? name ?? "there";
  return `Hello, ${displayName}! Your Auth0 user ID is ${authInfo.user.sub}`;
}
