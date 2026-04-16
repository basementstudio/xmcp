import { z } from "zod";
import {
  type InferSchema,
  type ToolExtraArguments,
  type ToolMetadata,
} from "xmcp";

export const schema = {
  scenario: z
    .enum(["form-accept", "url-accept", "form-cancel", "form-decline"])
    .describe("Which elicitation scenario to demonstrate"),
};

export const metadata: ToolMetadata = {
  name: "preview_elicitation",
  description: "Demonstrate extra.elicit() flows for screenshots and manual verification",
  annotations: {
    title: "Preview elicitation",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

export default async function previewElicitation(
  { scenario }: InferSchema<typeof schema>,
  extra: ToolExtraArguments
) {
  switch (scenario) {
    case "form-accept":
      return formatScenarioResult(
        scenario,
        await extra.elicit({
          message: "Choose a deployment target",
          requestedSchema: {
            type: "object",
            properties: {
              environment: {
                type: "string",
                title: "Environment",
                enum: ["staging", "production"],
              },
              approverEmail: {
                type: "string",
                title: "Approver email",
                format: "email",
                description: "Who approved this deployment?",
              },
              dryRun: {
                type: "boolean",
                title: "Dry run",
                default: true,
              },
            },
            required: ["environment", "approverEmail"],
          },
        })
      );

    case "url-accept":
      return formatScenarioResult(
        scenario,
        await extra.elicit({
          mode: "url",
          message: "Open the hosted OAuth flow to continue.",
          url: "https://xmcp.dev/demo/authorize",
          elicitationId: "oauth-demo-1",
        })
      );

    case "form-cancel":
      return formatScenarioResult(
        scenario,
        await extra.elicit({
          message: "Should we continue with production?",
          requestedSchema: {
            type: "object",
            properties: {
              decision: {
                type: "string",
                title: "Decision",
                enum: ["continue", "abort"],
                enumNames: ["Continue deployment", "Abort deployment"],
                default: "continue",
              },
            },
            required: ["decision"],
          },
        })
      );

    case "form-decline":
      return formatScenarioResult(
        scenario,
        await extra.elicit({
          message: "Should we continue with production?",
          requestedSchema: {
            type: "object",
            properties: {
              decision: {
                type: "string",
                title: "Decision",
                enum: ["continue", "abort"],
                enumNames: ["Continue deployment", "Abort deployment"],
                default: "continue",
              },
            },
            required: ["decision"],
          },
        })
      );
  }
}

function formatScenarioResult(scenario: string, result: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: `Scenario: ${scenario}\n${JSON.stringify(result, null, 2)}`,
      },
    ],
  };
}
