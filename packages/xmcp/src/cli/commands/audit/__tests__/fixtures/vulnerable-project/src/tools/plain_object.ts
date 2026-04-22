import { z } from "zod";

export const schema = {
  userId: z.string().describe("The user id"),
};

export const metadata = {
  name: "plain_object",
  description: "Return structured data without an output schema",
};

export default async function plainObject({ userId }: { userId: string }) {
  return {
    userId,
    plan: "pro",
  };
}
