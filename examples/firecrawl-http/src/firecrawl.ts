import { z } from "zod";

// Allow Firecrawl's documented 60-second scrape budget plus network overhead.
const REQUEST_TIMEOUT_MS = 75_000;

export const pageUrl = z
  .url({ protocol: /^https?$/ })
  .refine((value) => {
    if (!URL.canParse(value)) return false;
    const url = new URL(value);
    return !url.username && !url.password;
  }, "Use an HTTP(S) URL without embedded credentials")
  .describe("The HTTP(S) page or site URL to send to Firecrawl");

function toolError(error: string, retryAfterSeconds?: number) {
  return {
    isError: true as const,
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({ error, retryAfterSeconds }),
      },
    ],
  };
}

export async function firecrawlRequest<T>(
  endpoint: "/v2/scrape" | "/v2/map",
  body: Record<string, unknown>,
  responseSchema: z.ZodType<T>
): Promise<{
  isError?: true;
  content: { type: "text"; text: string }[];
}> {
  const key = process.env.FIRECRAWL_API_KEY;
  if (!key?.trim()) {
    return toolError("Set FIRECRAWL_API_KEY before using this example.");
  }
  try {
    const response = await fetch(
      new URL(endpoint, "https://api.firecrawl.dev"),
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        redirect: "error",
      }
    );
    if (!response.ok) {
      const retryAfter = response.headers.get("retry-after");
      return toolError(
        `Firecrawl returned HTTP ${response.status}. Check your key, credits, and request parameters.`,
        response.status === 429 && retryAfter && /^\d+$/.test(retryAfter)
          ? Number(retryAfter)
          : undefined
      );
    }
    const parsed = responseSchema.safeParse(await response.json());
    if (!parsed.success) {
      return toolError(
        "Firecrawl returned an unsuccessful or unexpected response."
      );
    }
    return {
      content: [{ type: "text" as const, text: JSON.stringify(parsed.data) }],
    };
  } catch {
    return toolError(
      "Firecrawl could not be reached or returned invalid JSON. Try again later."
    );
  }
}

export const pageMetadata = z
  .object({
    title: z.string().optional(),
    description: z.string().optional(),
    sourceURL: z.string().optional(),
    statusCode: z.number().optional(),
  })
  .passthrough()
  .optional();
