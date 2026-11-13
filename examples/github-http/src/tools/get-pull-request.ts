import type { InferSchema, ToolMetadata } from "xmcp";
import { z } from "zod";
import { githubRequest, pullRequest, repository, toolResult } from "../github";

export const schema = { ...repository, number: z.number().int().positive() };
export const metadata: ToolMetadata = {
  name: "get-pull-request",
  description:
    "Read a GitHub pull request's description, base/head refs and commit SHAs, and merge status. Does not fetch review comments, checks, or diffs.",
  annotations: { readOnlyHint: true, openWorldHint: true },
};
const ref = z.object({
  ref: z.string(),
  sha: z.string(),
  repo: z.object({ full_name: z.string() }).nullable(),
});
const responseSchema = pullRequest.extend({
  merged: z.boolean(),
  mergeable: z.boolean().nullable(),
  head: ref,
  base: ref,
});
export default async function getPullRequest({
  owner,
  repo,
  number,
}: InferSchema<typeof schema>) {
  const result = await githubRequest(
    `${owner}/${repo}/pulls/${number}`,
    {},
    responseSchema
  );
  return "error" in result ? result.error : toolResult(result.data);
}
