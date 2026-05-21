import { type ToolExtraArguments, type ToolMetadata } from "xmcp";

export const metadata: ToolMetadata = {
  name: "preview-elicitation",
  description: "Preview a basic extra.elicit() flow in MCPJam",
  annotations: {
    title: "Preview elicitation",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

export default async function previewElicitation(
  _: any,
  extra: ToolExtraArguments
) {
  const result = await extra.elicit({
    message: "Choose a deployment target",
    requestedSchema: {
      type: "object",
      properties: {
        environment: {
          type: "string",
          title: "Environment",
          enum: ["staging", "production"],
          enumNames: ["Staging", "Production"],
          default: "staging",
        },
      },
      required: ["environment"],
    },
  });

  return JSON.stringify(result, null, 2);
}
