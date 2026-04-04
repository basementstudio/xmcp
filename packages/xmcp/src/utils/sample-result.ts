import type { SampleContent, SampleResult } from "@/types/tool";

type TextSampleContent = Extract<SampleContent, { type: "text" }>;

export function getSampleContentBlocks(result: SampleResult): SampleContent[] {
  return Array.isArray(result.content) ? result.content : [result.content];
}

export function getSampleTextContent(result: SampleResult): string {
  return getSampleContentBlocks(result)
    .filter(
      (block): block is TextSampleContent =>
        block.type === "text" && typeof block.text === "string"
    )
    .map((block) => block.text)
    .join("\n");
}
