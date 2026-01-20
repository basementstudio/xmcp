import { type ResourceMetadata } from "xmcp";
import { getUsersService } from "../../../users/users.service";

export const metadata: ResourceMetadata = {
  name: "user-profile",
  title: "User Profile",
  description: "Get the profile information for a specific user",
};

interface ResourceParams {
  userId: string;
}

export default function handler({ userId }: ResourceParams) {
  const usersService = getUsersService();

  try {
    const user = usersService.findOne(userId);
    return JSON.stringify(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        memberSince: user.createdAt.toISOString(),
        lastUpdated: user.updatedAt.toISOString(),
      },
      null,
      2
    );
  } catch {
    return JSON.stringify(
      {
        error: "User not found",
        userId,
      },
      null,
      2
    );
  }
}
