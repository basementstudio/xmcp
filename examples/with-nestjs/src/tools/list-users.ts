import { type ToolMetadata } from "xmcp";
import { getUsersStore } from "../users/users.store";

export const schema = {};

export const metadata: ToolMetadata = {
  name: "list-users",
  description: "List all users in the system",
};

export default async function listUsers() {
  const usersStore = getUsersStore();
  const users = usersStore.findAll();

  if (users.length === 0) {
    return {
      content: [{ type: "text", text: "No users found in the system." }],
    };
  }

  const userList = users
    .map(
      (user, index) =>
        `${index + 1}. ${user.name} (${user.email}) - ID: ${user.id}`
    )
    .join("\n");

  return {
    content: [
      {
        type: "text",
        text: `Found ${users.length} user(s):\n\n${userList}`,
      },
    ],
  };
}
