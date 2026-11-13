import type { InferSchema, ToolMetadata } from "xmcp";
import { z } from "zod";

import { inboxResult, inboxSchema, paginationSchema } from "../inboxes";
import { getResend } from "../resend";

export const schema = {
  ...inboxSchema,
  ...paginationSchema,
  folders: z
    .array(z.enum(["inbox", "archive", "spam", "trash", "sent"]))
    .min(1)
    .max(5)
    .optional(),
  read: z.boolean().optional(),
};

export const metadata: ToolMetadata = {
  name: "list-inbox-threads",
  description:
    "List conversations in a Resend inbox, optionally filtered by folder and read status.",
  annotations: { readOnlyHint: true, openWorldHint: true },
};

export default async function listInboxThreads(
  input: InferSchema<typeof schema>
) {
  return inboxResult(await getResend().inboxes.threads.list(input));
}
