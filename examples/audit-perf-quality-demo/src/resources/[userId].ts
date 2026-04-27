import { z } from "zod";
import { type ResourceMetadata } from "xmcp";

export const schema = {
  id: z.string().max(64).describe("User identifier"),
};

export const metadata: ResourceMetadata = {
  name: "user_profile",
  title: "User profile",
  description: "Profile JSON for a single user.",
  mimeType: "application/json",
};

export default async function userProfile({ id }: { id: string }) {
  return JSON.stringify({ id, name: "demo" });
}
