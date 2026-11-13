import { z } from "zod";

// Bound provider outages; never automatically retry mutations.
const REQUEST_TIMEOUT_MS = 30_000;
const RETRY_GUIDANCE =
  "If creating an issue, check Linear before retrying to avoid duplicates.";

export const pagination = {
  limit: z.number().int().min(1).max(50).default(20),
  after: z
    .string()
    .min(1)
    .optional()
    .describe("Previous pageInfo.endCursor; keep other arguments unchanged"),
};
export const pageInfo = z.object({
  hasNextPage: z.boolean(),
  endCursor: z.string().nullable(),
});
export const issue = z.object({
  id: z.string(),
  identifier: z.string(),
  title: z.string(),
  url: z.string(),
});

export function toolError(error: string) {
  return {
    isError: true as const,
    content: [{ type: "text" as const, text: JSON.stringify({ error }) }],
  };
}

export async function linearRequest<T>(
  query: string,
  variables: Record<string, unknown>,
  schema: z.ZodType<T>
): Promise<{
  isError?: true;
  content: { type: "text"; text: string }[];
}> {
  const key = process.env.LINEAR_API_KEY;
  if (!key?.trim())
    return toolError(
      "Set LINEAR_API_KEY to a personal API key before using this example."
    );
  try {
    const response = await fetch("https://api.linear.app/graphql", {
      method: "POST",
      headers: {
        Authorization: key,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ query, variables }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      redirect: "error",
    });
    if (!response.ok)
      return toolError(
        `Linear returned HTTP ${response.status}. Check API access and rate limits. ${RETRY_GUIDANCE}`
      );
    const result = z
      .object({
        data: z.unknown().optional(),
        errors: z.array(z.unknown()).optional(),
      })
      .safeParse(await response.json());
    if (!result.success || result.data.errors?.length)
      return toolError(
        `Linear returned GraphQL errors or an unexpected response. ${RETRY_GUIDANCE}`
      );
    const parsed = schema.safeParse(result.data.data);
    if (!parsed.success)
      return toolError(
        `Linear returned incomplete or unsuccessful data. ${RETRY_GUIDANCE}`
      );
    return { content: [{ type: "text", text: JSON.stringify(parsed.data) }] };
  } catch {
    return toolError(
      `Linear could not be reached or returned invalid JSON. ${RETRY_GUIDANCE}`
    );
  }
}
