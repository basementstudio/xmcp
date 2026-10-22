import type { InferSchema, ToolMetadata } from "xmcp";
import { z } from "zod";

import { getResend } from "../resend";

export const schema = {
  id: z.uuid().describe("Email ID returned by send-email"),
};

export const metadata: ToolMetadata = {
  name: "get-email",
  description: "Retrieve the latest delivery event for a sent Resend email.",
  annotations: { readOnlyHint: true, openWorldHint: true },
};

export default async function getEmail({ id }: InferSchema<typeof schema>) {
  const { data, error } = await getResend().emails.get(id);
  if (error) {
    return {
      isError: true,
      content: [
        {
          type: "text" as const,
          text: `Resend lookup failed: ${error.name}. Check the email ID and the server's API key permissions.`,
        },
      ],
    };
  }
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({
          id: data.id,
          subject: data.subject,
          createdAt: data.created_at,
          lastEvent: data.last_event,
        }),
      },
    ],
  };
}
