import { z } from "zod";
import { type InferSchema, type ToolMetadata } from "xmcp";

export const schema = {
  comment: z.string().describe("Free-form comment to attach to the issue"),
};

export const metadata: ToolMetadata = {
  name: "attach_comment",
  description: "Attach a free-form comment to an issue.",
};

export default async function attachComment({
  comment,
}: InferSchema<typeof schema>) {
  return `attached: ${comment.slice(0, 30)}`;
}
