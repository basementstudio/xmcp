import type { InferSchema, ToolMetadata } from "xmcp";

import { inboxResult, inboxSchema } from "../inboxes";
import { getResend } from "../resend";

export const schema = {
  ...inboxSchema,
};

export const metadata: ToolMetadata = {
  name: "get-inbox",
  description: "Retrieve a Resend inbox, including its receiving address.",
  annotations: { readOnlyHint: true, openWorldHint: true },
};

export default async function getInbox(input: InferSchema<typeof schema>) {
  return inboxResult(await getResend().inboxes.get(input.inboxId));
}
