import type { InferSchema, ToolMetadata } from "xmcp";
import { z } from "zod";

import { getResend, requiredEnv } from "../resend";

export const schema = {
  to: z.email().describe("Recipient email address"),
  subject: z.string().min(1).max(998).describe("Email subject"),
  text: z.string().min(1).describe("Plain text email body"),
  idempotencyKey: z
    .string()
    .min(1)
    .max(256)
    .optional()
    .describe(
      "Reuse with the same payload to deduplicate retries for 24 hours"
    ),
};

export const metadata: ToolMetadata = {
  name: "send-email",
  description: "Send an email through Resend from the configured sender.",
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: true,
  },
};

export default async function sendEmail({
  to,
  subject,
  text,
  idempotencyKey,
}: InferSchema<typeof schema>) {
  const { data, error } = await getResend().emails.send(
    { from: requiredEnv("RESEND_FROM"), to, subject, text },
    { idempotencyKey }
  );
  if (error) {
    return {
      isError: true,
      content: [
        {
          type: "text" as const,
          text: `Resend send failed: ${error.name}. Check the server's Resend configuration and request in the dashboard.`,
        },
      ],
    };
  }
  return {
    content: [{ type: "text" as const, text: JSON.stringify({ id: data.id }) }],
  };
}
