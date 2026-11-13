import type { InferSchema, ToolMetadata } from "xmcp";
import { z } from "zod";

import { idempotencySchema, inboxResult, inboxSchema } from "../inboxes";
import { getResend } from "../resend";

export const schema = {
  ...inboxSchema,
  draftId: z.uuid(),
  ...idempotencySchema,
};

export const metadata: ToolMetadata = {
  name: "send-inbox-draft",
  description:
    "Send an existing Resend inbox draft to its recipients. This sends a real email.",
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: true,
  },
};

export default async function sendInboxDraft(
  input: InferSchema<typeof schema>
) {
  const { idempotencyKey, ...payload } = input;
  return inboxResult(
    await getResend().inboxes.drafts.send(payload, { idempotencyKey })
  );
}
