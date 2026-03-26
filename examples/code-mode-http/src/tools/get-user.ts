import { z } from "zod";
import type { ToolMetadata } from "xmcp";

export const schema = {
  userId: z.string().describe("The user ID to look up"),
};

export const metadata: ToolMetadata = {
  name: "get-user",
  description: "Retrieve user profile information by ID",
  annotations: { readOnlyHint: true },
};

const users: Record<string, { id: string; name: string; email: string }> = {
  "1": { id: "1", name: "Alice", email: "alice@example.com" },
  "2": { id: "2", name: "Bob", email: "bob@example.com" },
  "3": { id: "3", name: "Charlie", email: "charlie@example.com" },
};

export default async function getUser({ userId }: { userId: string }) {
  const user = users[userId];
  if (!user) {
    return `User with ID "${userId}" not found`;
  }
  return JSON.stringify(user);
}
