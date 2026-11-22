import { notFound } from "next/navigation";
import { estimateTokens } from "../../../lib/estimate-tokens";
import {
  getLLMSection,
  llmSectionFile,
  llmSectionNames,
} from "../../../lib/llm-sections";

export const revalidate = false;
export const dynamicParams = false;

const FILE_EXTENSION = ".txt";

export async function GET(
  _req: Request,
  { params }: RouteContext<"/llms-full/[section]">
) {
  const { section: file } = await params;
  if (!file.endsWith(FILE_EXTENSION)) notFound();
  const section = await getLLMSection(file.slice(0, -FILE_EXTENSION.length));
  if (!section) notFound();

  return new Response(section.text, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "x-markdown-tokens": String(estimateTokens(section.text)),
    },
  });
}

export function generateStaticParams() {
  return llmSectionNames().map((name) => ({ section: llmSectionFile(name) }));
}
