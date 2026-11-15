import { z } from "zod";
import { type InferSchema, type ToolMetadata } from "xmcp";

export const schema = {
  since: z.string().describe("Version tag to list changes after, e.g. v1.2.0"),
};

export const metadata: ToolMetadata = {
  name: "list-merged-changes",
  description: "List the changes merged since a release tag",
  annotations: { readOnlyHint: true },
};

const CHANGES = [
  { title: "Add CSV export to reports", type: "feature" },
  { title: "Fix timezone drift in scheduled jobs", type: "fix" },
  { title: "Upgrade the HTTP client", type: "chore" },
];

export default function listMergedChanges({
  since,
}: InferSchema<typeof schema>) {
  return { structuredContent: { since, changes: CHANGES } };
}
