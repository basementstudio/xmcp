import { z } from "zod";
import { type InferSchema, type ToolMetadata, logger } from "xmcp";

export const schema = {
  a: z.number().describe("First number"),
  b: z.number().describe("Second number"),
};

export const metadata: ToolMetadata = {
  name: "add",
  description: "Add two numbers together",
};

export default async function add({ a, b }: InferSchema<typeof schema>) {
  logger.info(`Adding ${a} + ${b}`, "add");

  const result = a + b;

  logger.debug({ a, b, result }, "add");

  return `Result: ${result}`;
}
