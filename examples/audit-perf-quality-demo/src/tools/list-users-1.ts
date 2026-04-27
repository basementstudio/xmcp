import { type ToolMetadata } from "xmcp";

export const schema = {};

export const metadata: ToolMetadata = {
  name: "list_users_active",
  description:
    "List all active users in the database with their basic profile fields.",
};

export default async function listUsersActive() {
  return [];
}
