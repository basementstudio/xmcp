import { z } from "zod";

// Bound provider outages without retrying a potentially successful publication.
const REQUEST_TIMEOUT_MS = 30_000;
export const xId = z.string().regex(/^[0-9]{1,19}$/);
export const user = z.object({
  id: xId,
  name: z.string(),
  username: z.string(),
});
export const post = z.object({
  id: xId,
  text: z.string(),
  author_id: xId.optional(),
  created_at: z.string().optional(),
});
export function toolResult(data: unknown): {
  isError?: true;
  content: { type: "text"; text: string }[];
} {
  return { content: [{ type: "text" as const, text: JSON.stringify(data) }] };
}
export function toolError(error: string) {
  return { isError: true as const, ...toolResult({ error }) };
}

export async function xRequest<T>(
  path: string,
  schema: z.ZodType<T>,
  options: {
    query?: Record<string, string | undefined>;
    body?: Record<string, unknown>;
  } = {}
): Promise<{ data: T } | { error: ReturnType<typeof toolError> }> {
  const token = process.env.X_USER_ACCESS_TOKEN;
  if (!token?.trim())
    return {
      error: toolError(
        "Set X_USER_ACCESS_TOKEN to an OAuth 2.0 user access token before using this example."
      ),
    };
  const url = new URL(`https://api.x.com/2${path}`);
  for (const [key, value] of Object.entries(options.query ?? {}))
    if (value !== undefined) url.searchParams.set(key, value);
  const uncertain = options.body
    ? " Check the account before retrying: the post may already be published. There is no automatic retry or deduplication."
    : "";
  try {
    const response = await fetch(url, {
      method: options.body ? "POST" : "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      ...(options.body ? { body: JSON.stringify(options.body) } : {}),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      redirect: "error",
    });
    if (!response.ok)
      return {
        error: toolError(
          `X returned HTTP ${response.status}. Check token expiry, OAuth scopes, API credits, and rate limits.${uncertain}`
        ),
      };
    const payload = await response.json();
    const envelope = z
      .object({ errors: z.array(z.unknown()).optional() })
      .safeParse(payload);
    if (!envelope.success || envelope.data.errors?.length)
      return {
        error: toolError(`X returned API errors or partial data.${uncertain}`),
      };
    const parsed = schema.safeParse(payload);
    if (!parsed.success)
      return {
        error: toolError(`X returned an unexpected response.${uncertain}`),
      };
    return { data: parsed.data };
  } catch {
    return {
      error: toolError(
        `X could not be reached or returned invalid JSON.${uncertain}`
      ),
    };
  }
}
export function currentUser() {
  return xRequest("/users/me", z.object({ data: user }));
}
