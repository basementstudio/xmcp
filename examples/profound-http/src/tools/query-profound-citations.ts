import type { InferSchema, ToolMetadata } from "xmcp";

import { profoundRequest } from "../profound";
import { reportBody, reportSchema } from "../reports";

export const schema = { ...reportSchema };
export const metadata: ToolMetadata = {
  name: "query-profound-citations",
  description:
    "Retrieve one page of Profound v2 domain citation metrics. Defaults to owned domains; use scope all to include other domains.",
  annotations: { readOnlyHint: true, openWorldHint: true },
};
export default function queryProfoundCitations(
  input: InferSchema<typeof schema>
) {
  return profoundRequest("/v2/reports/citations", {
    body: { ...reportBody(input), entity: "domain" },
  });
}
