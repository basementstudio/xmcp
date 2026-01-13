import { z } from "zod";
import type { InferSchema, ToolMetadata } from "xmcp";
import { getAuthInfo, getManagementClient } from "@xmcp-dev/auth0";

export const schema = {
  key: z.string().describe("The metadata key to update"),
  value: z.string().describe("The value to set"),
};

export const metadata: ToolMetadata = {
  name: "update_user_metadata",
  description: "Update your user_metadata in Auth0",
};

export default async function updateUserMetadata({
  key,
  value,
}: InferSchema<typeof schema>) {
  const authInfo = getAuthInfo();
  const client = getManagementClient();

  try {
    await client.users.update(authInfo.extra.sub, {
      user_metadata: { [key]: value },
    });
    return `Successfully updated user_metadata.${key} to "${value}"`;
  } catch (error) {
    return error instanceof Error ? error.message : "Failed to update user metadata";
  }
}
