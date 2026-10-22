import type { InferSchema, ToolMetadata } from "xmcp";
import { z } from "zod";

import { idempotencySchema, inboxResult, threadSchema } from "../inboxes";
import { getResend } from "../resend";

export const schema = {
  ...threadSchema,
  emailId: z.uuid(),
  text: z.string().min(1),
  replyAll: z.boolean().default(false),
  ...idempotencySchema,
};

export const metadata: ToolMetadata = {
  name: "reply-inbox-email",
  description:
    "Send a plain-text reply to a message from the inbox address. This sends a real email. Resend selects the original Reply-To or sender; replyAll includes the thread recipients.",
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: true,
  },
};

export default async function replyInboxEmail(
  input: InferSchema<typeof schema>
) {
  const { idempotencyKey, ...payload } = input;
  return inboxResult(
    await getResend().inboxes.threads.emails.reply(payload, { idempotencyKey })
  );
}
