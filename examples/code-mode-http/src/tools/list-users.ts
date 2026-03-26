import type { ToolMetadata } from "xmcp";

export const metadata: ToolMetadata = {
  name: "list-users",
  description: "List all users in the system",
  annotations: {
    readOnlyHint: true,
    internal: true,
    tags: ["users", "read"],
  },
};

const users = [
  { id: "1", name: "Alice", email: "alice@example.com" },
  { id: "2", name: "Bob", email: "bob@example.com" },
  { id: "3", name: "Charlie", email: "charlie@example.com" },
];

export default async function listUsers() {
  return JSON.stringify(users);
}
