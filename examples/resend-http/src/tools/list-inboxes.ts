import type { InferSchema, ToolMetadata } from "xmcp";

import { inboxResult, paginationSchema } from "../inboxes";
import { getResend } from "../resend";

export const schema = {
  ...paginationSchema,
};

export const metadata: ToolMetadata = {
  name: "list-inboxes",
  description: "List Resend inboxes for the connected team.",
  annotations: { readOnlyHint: true, openWorldHint: true },
};

export default async function listInboxes(input: InferSchema<typeof schema>) {
  return inboxResult(await getResend().inboxes.list(input));
}
