import { z } from "zod";
import { type InferSchema, type ToolMetadata } from "xmcp";

export const schema = {
  topic: z.string().max(64).describe("Topic to summarize"),
};

export const metadata: ToolMetadata = {
  name: "verbose_summary",
  description:
    "This tool returns a verbose, lavishly-detailed summary about the requested topic. It supports a wide variety of topics, including but not limited to: science, history, geography, politics, art, music, sports, technology, finance, philosophy, biology, chemistry, physics, mathematics, literature, languages, cooking, gardening, travel, fitness, mental health, parenting, pets, gaming, cinema, theater, dance, fashion, architecture, religion, mythology, astronomy, and many more besides. The summary format is loose; expect prose paragraphs, occasional bullet lists, and the occasional tangential aside that may or may not relate to the original topic. Length depends on the model's mood. Do not rely on this tool for anything that needs to be reproducible.",
};

export default async function verboseSummary({
  topic,
}: InferSchema<typeof schema>) {
  return `summary of ${topic}`;
}
