import { z } from "zod";
import { type InferSchema, type ToolMetadata } from "xmcp";

export const schema = {
  userId: z.string().max(64).describe("User id to load"),
};

export const metadata: ToolMetadata = {
  name: "get_user",
  description: "Return the user record for the given id.",
};

export default async function getUser({ userId }: InferSchema<typeof schema>) {
  return { id: userId, name: "Ada", role: "admin" };
}
