import { z } from "zod";
import { type InferSchema, type ToolMetadata } from "xmcp";
import { headers } from "xmcp/headers";
import { polar } from "../lib/polar";

export const schema = {
  name: z.string().describe("The name of the user to greet"),
};

export const metadata: ToolMetadata = {
  name: "greet",
  description: "Greet the user",
  annotations: {
    title: "Greet the user",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

export default async function greet({ name }: InferSchema<typeof schema>) {
  const result = `Hello, ${name}!`;

  const licenseKey = headers()["license-key"];
  const response = await polar.validateLicenseKey(licenseKey as string, {
    name: "test_tool_call",
    metadata: { tool_name: "greet", calls: 1 },
  });

  if (!response.valid) {
    return response.message;
  }

  return result;
}
