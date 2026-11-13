import { z } from "zod";

// Search needs more time than a metadata lookup, but must not wait indefinitely.
const REQUEST_TIMEOUT_MS = 90_000;
// Limits agentic turns, not the number of individual searches or total billing.
const MAX_SEARCH_TURNS = 3;
const DEFAULT_MODEL = "grok-4.7";
export const inputSchema = {
  prompt: z.string().trim().min(1).max(8000),
  maxOutputTokens: z
    .number()
    .int()
    .min(128)
    .max(4096)
    .default(1024)
    .describe(
      "Visible output-token limit; reasoning and search usage are billed separately"
    ),
};
const responseSchema = z.object({
  id: z.string(),
  model: z.string(),
  status: z.literal("completed"),
  error: z.null().optional(),
  output: z.array(
    z.object({
      type: z.string(),
      role: z.string().optional(),
      content: z.array(z.unknown()).optional(),
    })
  ),
});
const textBlock = z.object({
  type: z.literal("output_text"),
  text: z.string(),
  annotations: z.array(z.unknown()).optional(),
});
const citation = z.object({
  type: z.literal("url_citation"),
  url: z.url({ protocol: /^https?$/ }),
  title: z.string().optional(),
});
function toolError(error: string) {
  return {
    isError: true as const,
    content: [{ type: "text" as const, text: JSON.stringify({ error }) }],
  };
}

export async function grokRequest(
  input: z.infer<z.ZodObject<typeof inputSchema>>,
  search?: "web_search" | "x_search"
): Promise<{ isError?: true; content: { type: "text"; text: string }[] }> {
  const key = process.env.XAI_API_KEY;
  if (!key?.trim())
    return toolError("Set XAI_API_KEY before using this example.");
  const model = process.env.XAI_MODEL?.trim() || DEFAULT_MODEL;
  try {
    const response = await fetch("https://api.x.ai/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        input: [{ role: "user", content: input.prompt }],
        store: false,
        stream: false,
        max_output_tokens: input.maxOutputTokens,
        ...(search
          ? {
              tools: [{ type: search }],
              tool_choice: "required",
              max_turns: MAX_SEARCH_TURNS,
              parallel_tool_calls: false,
            }
          : {}),
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      redirect: "error",
    });
    if (!response.ok)
      return toolError(
        `Grok returned HTTP ${response.status}. Check the API key, model access, credits, and rate limits.`
      );
    const parsed = responseSchema.safeParse(await response.json());
    if (!parsed.success)
      return toolError(
        "Grok did not return a completed response. Check model support and output limits before retrying; usage may already be billed."
      );
    const blocks: z.infer<typeof textBlock>[] = [];
    for (const item of parsed.data.output) {
      if (item.type !== "message" || item.role !== "assistant") continue;
      for (const content of item.content ?? []) {
        const block = textBlock.safeParse(content);
        if (!block.success)
          return toolError(
            "Grok returned a refusal or an unexpected message format."
          );
        blocks.push(block.data);
      }
    }
    const text = blocks.map((block) => block.text).join("\n\n");
    if (!text.trim()) return toolError("Grok returned no answer text.");
    // Return only answer text and source URLs; reasoning/tool internals stay out of MCP output.
    const citations = new Map<string, { url: string; title?: string }>();
    for (const block of blocks)
      for (const annotation of block.annotations ?? []) {
        const parsedCitation = citation.safeParse(annotation);
        if (parsedCitation.success) {
          const { url, title } = parsedCitation.data;
          citations.set(url, { url, title });
        }
      }
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            responseId: parsed.data.id,
            model: parsed.data.model,
            text,
            citations: [...citations.values()],
          }),
        },
      ],
    };
  } catch {
    return toolError(
      "Grok could not be reached or returned invalid JSON. Requests are not retried automatically; a timeout does not guarantee provider processing or billing stopped."
    );
  }
}
