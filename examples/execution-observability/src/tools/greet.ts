import { z } from "zod";
export const schema = { name: z.string() };
export default function greet({ name }: { name: string }) {
  return `Hello, ${name}!`;
}
