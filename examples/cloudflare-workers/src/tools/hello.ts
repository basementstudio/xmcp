import { z } from "zod";
import type { ToolExtraArguments } from "xmcp";

export const metadata = {
  name: "hello",
  description: "Says hello to a user",
};

export const schema = {
  name: z.string().describe("The name to greet"),
};

export default async function hello(
  { name }: { name: string },
  extra: ToolExtraArguments
) {
  const greeting = `Hello, ${name}! From Cloudflare Workers.`;

  if (extra.authInfo) {
    return `${greeting}\n(Authenticated as: ${extra.authInfo.clientId})`;
  }

  return greeting;
}
