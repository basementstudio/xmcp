import { z } from "zod";
import type { InferSchema, ToolMetadata } from "xmcp";
import { getSession } from "@xmcp-dev/clerk";

export const schema = {
  name: z.string().describe("The name of the person to greet"),
};

export const metadata: ToolMetadata = {
  name: "greet",
  description: "Greet a person with their name and show your Clerk identity",
  annotations: {
    title: "Greet",
    readOnlyHint: true,
    idempotentHint: true,
  },
};

export default async function greet({
  name,
}: InferSchema<typeof schema>): Promise<string> {
  const session = getSession();

  return `Hello, ${name}! I'm authenticated as user: ${session.userId}`;
}

