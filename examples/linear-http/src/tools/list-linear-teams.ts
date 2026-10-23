import type { InferSchema, ToolMetadata } from "xmcp";
import { z } from "zod";
import { linearRequest, pagination, pageInfo } from "../linear";

export const schema = { ...pagination };
export const metadata: ToolMetadata = {
  name: "list-linear-teams",
  description:
    "List one page of teams accessible to the server's Linear personal API key. Use team IDs when listing or creating issues.",
  annotations: { readOnlyHint: true, openWorldHint: true },
};
const responseSchema = z.object({
  teams: z.object({
    nodes: z.array(
      z.object({ id: z.string(), key: z.string(), name: z.string() })
    ),
    pageInfo,
  }),
});

export default function listTeams({
  limit,
  after,
}: InferSchema<typeof schema>) {
  return linearRequest(
    `query ListTeams($first: Int!, $after: String) {
    teams(first: $first, after: $after) { nodes { id key name } pageInfo { hasNextPage endCursor } }
  }`,
    { first: limit, after },
    responseSchema
  );
}
