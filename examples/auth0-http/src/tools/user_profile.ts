import type { ToolMetadata } from "xmcp";
import { getUser } from "@xmcp-dev/auth0";

export const metadata: ToolMetadata = {
  name: "user_profile",
  description: "Get your full Auth0 user profile including metadata",
};

export default async function userProfile() {
  try {
    const user = await getUser();
    return JSON.stringify(
      {
        id: user.user_id,
        email: user.email,
        email_verified: user.email_verified,
        name: user.name,
        nickname: user.nickname,
        picture: user.picture,
        created_at: user.created_at,
        updated_at: user.updated_at,
        user_metadata: user.user_metadata,
        app_metadata: user.app_metadata,
      },
      null,
      2
    );
  } catch (error) {
    return error instanceof Error ? error.message : "Failed to get user profile";
  }
}
