import type { InferSchema, ToolMetadata } from "xmcp";
import { z } from "zod";
import { post, toolResult, xId, xRequest } from "../x";
export const schema = {
  text: z
    .string()
    .trim()
    .min(1)
    .max(280)
    .describe(
      "Final text approved for publication; X also enforces its own weighted-length rules"
    ),
  replyToId: xId
    .optional()
    .describe("Post ID to reply to; omit for a new standalone post"),
};
export const metadata: ToolMetadata = {
  name: "publish-x-post",
  description:
    "Publish a real public X post or reply with the server's OAuth user token, only when the user explicitly requests that text be published. Check the account before retrying any uncertain failure to avoid duplicates.",
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: true,
  },
};
export default async function publishPost({
  text,
  replyToId,
}: InferSchema<typeof schema>) {
  const result = await xRequest("/tweets", z.object({ data: post }), {
    body: {
      text,
      ...(replyToId ? { reply: { in_reply_to_tweet_id: replyToId } } : {}),
    },
  });
  return "error" in result
    ? result.error
    : toolResult({
        post: result.data.data,
        url: `https://x.com/i/status/${result.data.data.id}`,
      });
}
