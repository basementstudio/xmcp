import { z } from "zod";

export const metadata = {
  name: "hello",
  description: "Says hello to a user",
};

export const schema = {
  name: z.string().describe("The name to greet"),
};

export default async function hello({ name }: { name: string }) {
  return `Hello, ${name}! From Cloudflare Workers.`;
}
