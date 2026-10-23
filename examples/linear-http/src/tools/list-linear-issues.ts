import type { InferSchema, ToolMetadata } from "xmcp";
import { z } from "zod";
import { issue, linearRequest, pagination, pageInfo } from "../linear";

export const schema = {
  teamId: z.uuid().describe("Team UUID from list-linear-teams"),
  ...pagination,
};
export const metadata: ToolMetadata = {
  name: "list-linear-issues",
  description:
    "List one page of a Linear team's issues. Archived issues are excluded by the provider's default.",
  annotations: { readOnlyHint: true, openWorldHint: true },
};
const responseSchema = z.object({
  issues: z.object({
    nodes: z.array(issue.extend({ description: z.string().nullable() })),
    pageInfo,
  }),
});

export default function listIssues({
  teamId,
  limit,
  after,
}: InferSchema<typeof schema>) {
  return linearRequest(
    `query ListIssues($filter: IssueFilter, $first: Int!, $after: String) {
    issues(filter: $filter, first: $first, after: $after) {
      nodes { id identifier title url description } pageInfo { hasNextPage endCursor }
    }
  }`,
    { filter: { team: { id: { eq: teamId } } }, first: limit, after },
    responseSchema
  );
}
