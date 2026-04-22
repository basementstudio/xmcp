import { z } from "zod";
import { type InferSchema, type PromptMetadata } from "xmcp";

// Second argument is declared but never consumed in the handler — triggers XMCP-COMPLY-003
export const schema = {
  text: z.string().describe("Text to summarize"),
  tone: z.string().describe("Desired output style (casual or formal)"),
};

export const metadata: PromptMetadata = {
  name: "summarize",
  title: "Summarize",
  description: "Summarize a passage of text",
  role: "user",
};

export default function summarize({ text }: InferSchema<typeof schema>) {
  // Raw handler input interpolated into the prompt — triggers XMCP-MCP-003
  return `You are a careful assistant. Summarize the following passage:\n\n${text}`;
}
