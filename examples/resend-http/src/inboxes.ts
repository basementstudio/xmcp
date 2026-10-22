import { z } from "zod";

export const inboxSchema = {
  inboxId: z.uuid().describe("Resend Inbox ID"),
};
export const threadSchema = {
  ...inboxSchema,
  threadId: z.uuid().describe("Thread ID returned by list-inbox-threads"),
};
export const paginationSchema = {
  limit: z.number().int().min(1).max(100).default(20),
  after: z.uuid().optional().describe("Last item ID from the previous page"),
};
export const idempotencySchema = {
  idempotencyKey: z.string().min(1).max(256).optional(),
};

// Share the SDK-to-MCP response mapping across inbox tools without changing
// provider objects, retrying writes, or exposing provider error messages.
export function inboxResult(result: { data: unknown; error: unknown }) {
  if (result.error) {
    return {
      isError: true,
      content: [
        {
          type: "text" as const,
          text: "Resend inbox request failed. Check the IDs, inbox setup, and API key permissions.",
        },
      ],
    };
  }
  return {
    content: [{ type: "text" as const, text: JSON.stringify(result.data) }],
  };
}
