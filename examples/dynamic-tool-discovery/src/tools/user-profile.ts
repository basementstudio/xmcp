import { z } from "zod";
import { type InferSchema, type ToolMetadata } from "xmcp";

// This tool requires authentication. It won't appear in tool listings
// for unauthenticated clients.

export const schema = {
  field: z
    .enum(["email", "name", "role"])
    .describe("The profile field to retrieve"),
};

export const metadata: ToolMetadata = {
  name: "user-profile",
  description: "Retrieve the authenticated user's profile information.",
  requiresAuth: true,
  annotations: {
    title: "User Profile",
    readOnlyHint: true,
  },
};

export default async function userProfile({
  field,
}: InferSchema<typeof schema>) {
  return `Profile field "${field}" for the authenticated user.`;
}
