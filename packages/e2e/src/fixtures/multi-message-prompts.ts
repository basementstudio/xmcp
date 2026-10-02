export const MULTI_MESSAGE_PROMPT_FILES = {
  "src/prompts/few-shot.ts": `import { z } from "zod";
import type { GetPromptResult, PromptMessage } from "xmcp";
export const schema = { text: z.string(), format: z.enum(["array", "result"]) };
export const metadata = { name: "few-shot", title: "Few-shot prompt", description: "Classify sentiment", role: "assistant" };
export default async function fewShot({ text, format }: { text: string; format: "array" | "result" }): Promise<PromptMessage[] | GetPromptResult> {
  const messages: PromptMessage[] = [
    { role: "user", content: { type: "text", text: "Classify: I love it", _meta: { example: true } } },
    { role: "assistant", content: { type: "text", text: "positive" } },
    { role: "user", content: { type: "text", text: "Classify: I dislike it" } },
    { role: "assistant", content: { type: "text", text: "negative" } },
    { role: "user", content: { type: "text", text: "Classify: " + text } },
  ];
  return format === "array" ? messages : { description: "Few-shot sentiment classification", messages, _meta: { source: "few-shot" } };
}
`,
};
