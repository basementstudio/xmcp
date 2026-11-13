import type { InferSchema, ToolMetadata } from "xmcp";
import { z } from "zod";

import { profoundRequest } from "../profound";

export const schema = {
  organizationIds: z
    .array(z.uuid())
    .min(1)
    .max(20)
    .optional()
    .describe(
      "Optional organization filter; omit to list categories across the API key owner's memberships"
    ),
};
export const metadata: ToolMetadata = {
  name: "list-profound-categories",
  description:
    "List accessible Profound categories and their organizations for report queries.",
  annotations: { readOnlyHint: true, openWorldHint: true },
};
export default function listProfoundCategories({
  organizationIds,
}: InferSchema<typeof schema>) {
  const query = new URLSearchParams();
  for (const id of organizationIds ?? []) query.append("organization_ids", id);
  return profoundRequest("/v1/org/categories", { query });
}
