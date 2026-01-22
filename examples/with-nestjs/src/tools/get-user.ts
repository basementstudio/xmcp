import { z } from "zod";
import { type InferSchema, type ToolMetadata } from "xmcp";
import { getUsersStore } from "../users/users.store";

export const schema = {
  userId: z.string().describe("The ID of the user to retrieve"),
};

export const metadata: ToolMetadata = {
  name: "get-user",
  description: "Get details of a specific user by their ID",
  annotations: {
    title: "Get User",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

export default async function getUser({ userId }: InferSchema<typeof schema>) {
  const usersStore = getUsersStore();

  try {
    const user = usersStore.findOne(userId);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              id: user.id,
              name: user.name,
              email: user.email,
              createdAt: user.createdAt.toISOString(),
              updatedAt: user.updatedAt.toISOString(),
            },
            null,
            2
          ),
        },
      ],
    };
  } catch {
    return {
      content: [{ type: "text", text: `User with ID "${userId}" not found.` }],
      isError: true,
    };
  }
}
