import { z } from "zod";
import type { ToolMetadata } from "xmcp";

export const schema = {
  name: z.string().describe("The user's full name"),
  email: z.string().email().describe("The user's email address"),
};

export const metadata: ToolMetadata = {
  name: "create-user",
  description: "Create a new user account with name and email",
  annotations: {
    destructiveHint: true,
    internal: true,
    tags: ["users", "write"],
    examples: [
      {
        args: { name: "Alice", email: "alice@example.com" },
        description: "Create a new user",
      },
    ],
  },
};

export default async function createUser({
  name,
  email,
}: {
  name: string;
  email: string;
}) {
  const id = String(Math.floor(Math.random() * 10000));
  const user = { id, name, email };
  return JSON.stringify(user);
}
