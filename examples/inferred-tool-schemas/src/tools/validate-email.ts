import type { InferSchema } from "xmcp";
import { z } from "zod";

// Explicit schemas take precedence and express constraints absent from TS types.
export const schema = {
  email: z.string().email().describe("An email address to validate."),
};

export const metadata = {
  name: "validate-email",
  description: "Validate the format of an email address.",
};

export default function validateEmail({ email }: InferSchema<typeof schema>) {
  return `Valid email: ${email}`;
}
