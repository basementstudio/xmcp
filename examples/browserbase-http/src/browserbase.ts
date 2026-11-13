import { z } from "zod";

// Bound provider outages; writes must never be retried automatically.
const REQUEST_TIMEOUT_MS = 30_000;
// Bound browser usage even if the caller never releases the session.
export const DEFAULT_SESSION_TIMEOUT_SECONDS = 300;
export const MAX_SESSION_TIMEOUT_SECONDS = 3600;
export const sessionInput = {
  sessionId: z.uuid().describe("Browserbase session UUID"),
};
const session = z.object({
  id: z.uuid(),
  status: z.enum(["PENDING", "RUNNING", "ERROR", "TIMED_OUT", "COMPLETED"]),
  projectId: z.string(),
  expiresAt: z.string(),
  keepAlive: z.boolean(),
  region: z.string(),
});

function toolError(error: string) {
  return {
    isError: true as const,
    content: [{ type: "text" as const, text: JSON.stringify({ error }) }],
  };
}

export async function browserbaseRequest(
  path: string,
  body?: Record<string, unknown>
): Promise<{ isError?: boolean; content: { type: "text"; text: string }[] }> {
  const key = process.env.BROWSERBASE_API_KEY;
  if (!key?.trim())
    return toolError("Set BROWSERBASE_API_KEY before using this example.");
  const uncertain = body
    ? " Check the Browserbase dashboard before retrying: the request may have succeeded. Release unused sessions to stop usage charges."
    : "";
  try {
    const response = await fetch(
      `https://api.browserbase.com/v1/sessions${path}`,
      {
        method: body ? "POST" : "GET",
        headers: { "X-BB-API-Key": key, "Content-Type": "application/json" },
        ...(body ? { body: JSON.stringify(body) } : {}),
        redirect: "error",
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      }
    );
    if (!response.ok)
      return toolError(
        `Browserbase returned HTTP ${response.status}. Check the API key, plan limits, and session access.${uncertain}`
      );
    const parsed = session.safeParse(await response.json());
    if (!parsed.success)
      return toolError(
        `Browserbase returned an unexpected response.${uncertain}`
      );
    // Strip connectUrl, signingKey, and other provider fields from MCP output.
    // Browser connection credentials stay in trusted automation code.
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            session: parsed.data,
            dashboardUrl: `https://www.browserbase.com/sessions/${parsed.data.id}`,
          }),
        },
      ],
    };
  } catch {
    return toolError(
      `Browserbase could not be reached or returned invalid JSON.${uncertain}`
    );
  }
}
