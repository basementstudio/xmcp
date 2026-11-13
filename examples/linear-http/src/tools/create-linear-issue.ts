import type { InferSchema, ToolMetadata } from "xmcp";
import { z } from "zod";
import { issue, linearRequest } from "../linear";

export const schema = {
  teamId: z.uuid().describe("Destination team UUID from list-linear-teams"),
  title: z.string().trim().min(1).max(255),
  description: z
    .string()
    .max(10_000)
    .optional()
    .describe("Issue description in Markdown"),
};
export const metadata: ToolMetadata = {
  name: "create-linear-issue",
  description:
    "Create a real Linear issue when requested by the user. This writes to the server key's workspace. After any uncertain failure, check Linear before retrying to avoid duplicates.",
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: true,
  },
};
const responseSchema = z.object({
  issueCreate: z.object({ success: z.literal(true), issue }),
});

export default function createIssue(input: InferSchema<typeof schema>) {
  return linearRequest(
    `mutation CreateIssue($input: IssueCreateInput!) {
    issueCreate(input: $input) { success issue { id identifier title url } }
  }`,
    { input },
    responseSchema
  );
}
