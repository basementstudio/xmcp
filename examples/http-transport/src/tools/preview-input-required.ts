import { z } from "zod";
import {
  acceptedContent,
  inputRequired,
  type InferSchema,
  type ToolExtraArguments,
} from "xmcp";

export const schema = {
  theme: z.string().describe("The theme to apply"),
};

export const metadata = {
  name: "preview-input-required",
  description:
    "Ask the user to confirm before applying a theme, using a multi round-trip input_required result (protocol 2026-07-28; 2025-era clients are served through the SDK's legacy shim)",
  annotations: {
    readOnlyHint: true,
    idempotentHint: true,
  },
};

export default async function previewInputRequired(
  { theme }: InferSchema<typeof schema>,
  extra: ToolExtraArguments
) {
  const answer = acceptedContent<{ confirmed: boolean }>(
    extra.inputResponses,
    "confirmation"
  );

  if (!answer) {
    return inputRequired({
      inputRequests: {
        confirmation: inputRequired.elicit({
          message: `Apply the "${theme}" theme?`,
          requestedSchema: {
            type: "object",
            properties: {
              confirmed: {
                type: "boolean",
                title: "Confirm",
                description: "Apply the theme?",
              },
            },
            required: ["confirmed"],
          },
        }),
      },
    });
  }

  return answer.confirmed
    ? `Theme "${theme}" applied.`
    : `Theme change cancelled.`;
}
