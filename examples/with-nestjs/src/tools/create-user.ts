import { z } from "zod";
import { type InferSchema, type ToolMetadata } from "xmcp";
import { getUsersStore } from "../users/users.store";

export const schema = {
  name: z.string().min(2).describe("The name of the user (minimum 2 characters)"),
  email: z.string().email().describe("The email address of the user"),
};

export const metadata: ToolMetadata = {
  name: "create-user",
  description: "Create a new user in the system",
  annotations: {
    title: "Create User",
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
  },
};

export default async function createUser({ name, email }: InferSchema<typeof schema>) {
  const usersStore = getUsersStore();

  // Check if user with this email already exists
  const existingUser = usersStore.findByEmail(email);
  if (existingUser) {
    return {
      content: [
        { type: "text", text: `A user with email "${email}" already exists.` },
      ],
      isError: true,
    };
  }

  const user = usersStore.create({ name, email });

  return {
    content: [
      {
        type: "text",
        text: `User created successfully!\n\n${JSON.stringify(
          {
            id: user.id,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt.toISOString(),
          },
          null,
          2
        )}`,
      },
    ],
  };
}
