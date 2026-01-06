import { z } from "zod";
import type { InferSchema, ToolMetadata } from "xmcp";
import { getClerkSession } from "@xmcp-dev/clerk";

export const schema = {
  name: z.string().describe("The name of the person to greet"),
};

export const metadata: ToolMetadata = {
  name: "greet",
  description: "Greet a person with their name and show your Clerk identity",
  annotations: {
    title: "Greet",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

export default async function greet({
  name,
}: InferSchema<typeof schema>): Promise<{
  content: Array<{ type: "text"; text: string }>;
}> {
  const session = getClerkSession();

  const greeting = `Hello, ${name}! 👋

I'm authenticated as user: ${session.userId}
${session.organizationId ? `Organization: ${session.organizationId}` : "Not in an organization"}
${session.organizationRole ? `Role: ${session.organizationRole}` : ""}`;

  return {
    content: [
      {
        type: "text",
        text: greeting.trim(),
      },
    ],
  };
}

