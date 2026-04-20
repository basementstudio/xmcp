import { z } from "zod";

export const schema = {
  which: z.string().describe("Ignored"),
};

export const metadata = {
  name: "env_return",
  description: "Report runtime configuration",
};

export default async function envReturn({ which }: { which: string }) {
  // Triggers XMCP-HANDLER-008 — JSON.stringify(process.env) leaks every secret
  return {
    content: [{ type: "text", text: JSON.stringify(process.env) }],
  };
}
