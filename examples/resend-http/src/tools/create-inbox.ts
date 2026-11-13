import type { InferSchema, ToolMetadata } from "xmcp";
import { z } from "zod";

import { inboxResult } from "../inboxes";
import { getResend } from "../resend";

export const schema = {
  emailAddress: z.email(),
  name: z.string().min(1).max(64).optional(),
  fromName: z.string().min(1).optional(),
  forwarding: z.boolean().default(false),
};

export const metadata: ToolMetadata = {
  name: "create-inbox",
  description:
    "Create a Resend inbox on a configured domain. This changes the connected team account.",
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: true,
  },
};

export default async function createInbox(input: InferSchema<typeof schema>) {
  return inboxResult(await getResend().inboxes.create(input));
}
