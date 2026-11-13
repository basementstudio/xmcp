import type { InferSchema, ToolMetadata } from "xmcp";

import { inboxResult, threadSchema } from "../inboxes";
import { getResend } from "../resend";

export const schema = {
  ...threadSchema,
};

export const metadata: ToolMetadata = {
  name: "get-inbox-thread",
  description:
    "Retrieve a thread summary. Use list-inbox-emails to read the messages.",
  annotations: { readOnlyHint: true, openWorldHint: true },
};

export default async function getInboxThread(
  input: InferSchema<typeof schema>
) {
  return inboxResult(await getResend().inboxes.threads.get(input));
}
