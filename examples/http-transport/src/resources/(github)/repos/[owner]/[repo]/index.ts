import { z } from "zod";
import { type ResourceMetadata, type InferSchema } from "xmcp";

export const schema = {
  owner: z.string().describe("The owner of the repository"),
  repo: z.string().describe("The name of the repository"),
};

export const metadata: ResourceMetadata = {
  name: "github-repo",
  title: "GitHub Repository",
  description: "GitHub repository information",
};

export default function handler({ owner, repo }: InferSchema<typeof schema>) {
  return `Repository: ${owner}/${repo}`;
}
