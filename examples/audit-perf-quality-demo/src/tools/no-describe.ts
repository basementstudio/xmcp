import { z } from "zod";
import { type InferSchema, type ToolMetadata } from "xmcp";

export const schema = {
  name: z.string().max(64),
  age: z.number().min(0).max(150),
};

export const metadata: ToolMetadata = {
  name: "register_person",
  description: "Register a person record with the given name and age.",
};

export default async function registerPerson({
  name,
  age,
}: InferSchema<typeof schema>) {
  return `${name} (${age})`;
}
