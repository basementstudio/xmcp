import { convertToModelMessages, streamText } from "ai";
import { source } from "@/lib/source";
import { getLLMText } from "@/lib/get-llm-text";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

export const runtime = "edge";

export async function POST(req: Request) {
  const reqJson = await req.json();

  // Get all documentation pages and format them for the LLM
  const pages = source.getPages();
  const docsContent = await Promise.all(pages.map(getLLMText));
  const contextText = docsContent.join("\n\n");

  // Create system message with documentation context
  const systemMessage = {
    role: "system" as const,
    content: `You are a helpful documentation assistant. Answer user questions based on the following documentation.

Documentation:
${contextText}

Instructions:
1. First, provide a clear, helpful text response to the user's question based on the documentation
2. After your text response, use the provideLinks tool to cite relevant documentation pages
3. When calling provideLinks, extract the title and URL from the documentation above (format: "# Title (URL)")
4. Provide 1-3 most relevant links as citations with label "1", "2", etc.
5. Be concise but thorough in your explanations`,
  };

  const openrouter = createOpenRouter({
    apiKey: `${process.env.OPENROUTER_API_KEY}`,
  });

  const result = streamText({
    model: openrouter("meta-llama/llama-3.3-8b-instruct:free"),
    maxRetries: 5,
    messages: [
      systemMessage,
      ...convertToModelMessages(reqJson.messages, {
        ignoreIncompleteToolCalls: true,
      }),
    ],
    toolChoice: "auto",
  });

  return result.toUIMessageStreamResponse();
}
