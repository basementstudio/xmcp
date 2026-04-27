import { type ToolMetadata } from "xmcp";

export const schema = {};

export const metadata: ToolMetadata = {
  name: "list_users_archived",
  description:
    "List all archived users in the database with their basic profile fields.",
};

export default async function listUsersArchived() {
  return [];
}
