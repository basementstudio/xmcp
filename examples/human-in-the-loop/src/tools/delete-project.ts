import { z } from "zod";
import {
  inputRequired,
  inputResponse,
  type InferSchema,
  type ToolExtraArguments,
  type ToolMetadata,
} from "xmcp";

export const schema = {
  project: z.string().describe("The project to delete"),
};

export const metadata: ToolMetadata = {
  name: "delete-project",
  description: "Delete a project after the user confirms",
  annotations: { destructiveHint: true },
};

export default function deleteProject(
  { project }: InferSchema<typeof schema>,
  extra: ToolExtraArguments
) {
  const confirmation = inputResponse(extra.inputResponses, "confirmation");

  if (confirmation.kind !== "elicit") {
    return inputRequired({
      inputRequests: {
        confirmation: inputRequired.elicit({
          message: `Delete "${project}"? This cannot be undone.`,
          requestedSchema: {
            type: "object",
            properties: {
              confirmed: { type: "boolean", title: "Delete the project" },
            },
            required: ["confirmed"],
          },
        }),
      },
    });
  }

  const confirmed =
    confirmation.action === "accept" &&
    confirmation.content?.confirmed === true;

  return confirmed ? `Deleted "${project}".` : `Kept "${project}".`;
}
