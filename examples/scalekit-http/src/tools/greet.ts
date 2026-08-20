import { z } from "zod";
import type { InferSchema, ToolMetadata } from "xmcp";
import { getSession } from "@xmcp-dev/scalekit";

export const schema = {
  name: z.string().optional().describe("The name of the user to greet"),
};

export const metadata: ToolMetadata = {
  name: "greet",
  description: "Greet the user with their Scalekit identity",
};

export default function greet({ name }: InferSchema<typeof schema>): string {
  const session = getSession();
  const displayName = name ?? session.userId;
  return `Hello, ${displayName}! Your user ID is ${session.userId}`;
}