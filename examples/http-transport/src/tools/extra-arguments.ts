import { type ToolMetadata, type ToolExtraArguments } from "xmcp";

// Define tool metadata
export const metadata: ToolMetadata = {
  name: "extra-arguments",
  description: "Access the extra arguments from a tool call",
  annotations: {
    title: "Extra arguments",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

// Tool implementation
export default async function extraArguments(_: any, extra: ToolExtraArguments) {
  const extraArguments = JSON.stringify(extra); // to render a readable string
  const result = `Your extra arguments are: ${extraArguments}`;

  return {
    content: [{ type: "text", text: result }],
  };
}
