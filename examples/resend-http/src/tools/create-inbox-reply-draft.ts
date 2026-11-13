import type { InferSchema, ToolMetadata } from "xmcp";
import { z } from "zod";

import { idempotencySchema, inboxResult, threadSchema } from "../inboxes";
import { getResend } from "../resend";

export const schema = {
  ...threadSchema,
  replyToEmailId: z.uuid(),
  text: z.string().min(1),
  ...idempotencySchema,
};

export const metadata: ToolMetadata = {
  name: "create-inbox-reply-draft",
  description:
    "Prepare a plain-text reply draft without sending it. If a reply draft already exists for this email, Resend returns its ID without replacing the text; retrieve it before sending.",
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: true,
  },
};

export default async function createInboxReplyDraft(
  input: InferSchema<typeof schema>
) {
  const { idempotencyKey, ...payload } = input;
  return inboxResult(
    await getResend().inboxes.drafts.create(payload, { idempotencyKey })
  );
}
