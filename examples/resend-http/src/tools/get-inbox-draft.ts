import type { InferSchema, ToolMetadata } from "xmcp";
import { z } from "zod";

import { inboxResult, inboxSchema } from "../inboxes";
import { getResend } from "../resend";

export const schema = {
  ...inboxSchema,
  draftId: z.uuid(),
};

export const metadata: ToolMetadata = {
  name: "get-inbox-draft",
  description:
    "Read a Resend inbox draft, including its body and recipients, before deciding to send.",
  annotations: { readOnlyHint: true, openWorldHint: true },
};

export default async function getInboxDraft(input: InferSchema<typeof schema>) {
  return inboxResult(await getResend().inboxes.drafts.get(input));
}
