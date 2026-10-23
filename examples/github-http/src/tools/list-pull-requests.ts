import type { InferSchema, ToolMetadata } from "xmcp";
import { z } from "zod";
import { githubRequest, pullRequest, repository, toolResult } from "../github";

export const schema = {
  ...repository,
  state: z.enum(["open", "closed", "all"]).default("open"),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(20),
};
export const metadata: ToolMetadata = {
  name: "list-pull-requests",
  description:
    "List one page of GitHub pull requests, newest created first. Pass nextPage with unchanged arguments for more results.",
  annotations: { readOnlyHint: true, openWorldHint: true },
};
export default async function listPullRequests({
  owner,
  repo,
  state,
  page,
  limit,
}: InferSchema<typeof schema>) {
  const result = await githubRequest(
    `${owner}/${repo}/pulls`,
    {
      state,
      page: String(page),
      per_page: String(limit),
      sort: "created",
      direction: "desc",
    },
    z.array(pullRequest)
  );
  return "error" in result
    ? result.error
    : toolResult({
        pullRequests: result.data,
        nextPage: result.nextPage ?? null,
      });
}
