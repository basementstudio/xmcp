import { type ToolMetadata } from "xmcp";
import { clerkClient } from "@clerk/nextjs/server";

// Define tool metadata
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

// Tool implementation

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function greet(_args: any, extra: any) {
  // TO DO
  // implement framework side the extra parameter

  const clerk = await clerkClient();
  const userId = extra.authInfo!.extra!.userId! as string;
  const userData = await clerk.users.getUser(userId);
  const result = `Hello, ${userData.firstName}!`;

  return {
    content: [{ type: "text", text: result }],
  };
}
