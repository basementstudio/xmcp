// Bound provider outages without automatically retrying or fetching every page.
const REQUEST_TIMEOUT_MS = 30_000;

type ReportPath = `/v2/reports/${"visibility" | "citations"}`;
type Endpoint = "/v1/org/categories" | ReportPath;

export async function profoundRequest(
  path: Endpoint,
  options: { body?: Record<string, unknown>; query?: URLSearchParams } = {}
) {
  const key = process.env.PROFOUND_API_KEY;
  if (!key?.trim())
    throw new Error("Set PROFOUND_API_KEY before using this example.");
  const url = new URL(path, "https://api.tryprofound.com");
  if (options.query) url.search = options.query.toString();
  try {
    const response = await fetch(url, {
      method: options.body ? "POST" : "GET",
      headers: {
        "X-API-Key": key,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      redirect: "error",
    });
    if (!response.ok) {
      const retryAfter = response.headers.get("retry-after");
      return {
        isError: true,
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              error: `Profound returned HTTP ${response.status}. Check your API access, key, and query parameters.`,
              ...(response.status === 429 &&
              retryAfter &&
              /^\d+$/.test(retryAfter)
                ? { retryAfterSeconds: Number(retryAfter) }
                : {}),
            }),
          },
        ],
      };
    }
    const data: unknown = await response.json();
    // Preserve the report's info.next_cursor and unmodified metric values.
    return { content: [{ type: "text" as const, text: JSON.stringify(data) }] };
  } catch {
    return {
      isError: true,
      content: [
        {
          type: "text" as const,
          text: "Profound could not be reached or returned an invalid response. Try again later.",
        },
      ],
    };
  }
}
