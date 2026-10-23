import { z } from "zod";

// Bound provider outages without silently retrying or fetching further pages.
const REQUEST_TIMEOUT_MS = 30_000;
// Keep a single file within a practical tool response size.
export const MAX_FILE_BYTES = 100_000;
const segment = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[A-Za-z0-9_.-]+$/)
  .refine((value) => value !== "." && value !== "..");
export const repository = { owner: segment, repo: segment };
export const pullRequest = z.object({
  number: z.number(),
  title: z.string(),
  state: z.string(),
  html_url: z.string(),
  body: z.string().nullable(),
  draft: z.boolean().optional(),
});

export function toolError(error: string, retryAfterSeconds?: number) {
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
export function toolResult(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data) }] };
}

export async function githubRequest<T>(
  path: string,
  query: Record<string, string | undefined>,
  schema: z.ZodType<T>
): Promise<
  { data: T; nextPage?: number } | { error: ReturnType<typeof toolError> }
> {
  const key = process.env.GITHUB_TOKEN;
  if (!key?.trim())
    return { error: toolError("Set GITHUB_TOKEN before using this example.") };
  const url = new URL(`/repos/${path}`, "https://api.github.com");
  for (const [name, value] of Object.entries(query))
    if (value !== undefined) url.searchParams.set(name, value);
  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${key}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2026-03-10",
        "User-Agent": "xmcp-github-example",
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      redirect: "error",
    });
    if (!response.ok) {
      const retry = response.headers.get("retry-after");
      const seconds = retry && /^\d+$/.test(retry) ? Number(retry) : undefined;
      return {
        error: toolError(
          `GitHub returned HTTP ${response.status}. Check repository access, token permissions, and rate limits.`,
          (response.status === 403 || response.status === 429) &&
            Number.isSafeInteger(seconds)
            ? seconds
            : undefined
        ),
      };
    }
    const parsed = schema.safeParse(await response.json());
    if (!parsed.success)
      return { error: toolError("GitHub returned an unexpected response.") };
    // Return only a page number; never follow provider-supplied URLs with credentials.
    const next = response.headers
      .get("link")
      ?.split(",")
      .find((link) => /;\s*rel="next"/.test(link))
      ?.match(/<([^>]+)>/);
    const nextUrl = next ? new URL(next[1]) : undefined;
    const page = Number(nextUrl?.searchParams.get("page"));
    const nextPage =
      nextUrl?.origin === url.origin &&
      nextUrl.pathname === url.pathname &&
      Number.isSafeInteger(page) &&
      page > 0
        ? page
        : undefined;
    return { data: parsed.data, nextPage };
  } catch {
    return {
      error: toolError(
        "GitHub could not be reached or returned invalid JSON. Try again later."
      ),
    };
  }
}
