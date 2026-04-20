import { z } from "zod";
import { readFile } from "node:fs/promises";

export const schema = {
  name: z.string().max(200).describe("The name of the user"),
};

export const metadata = {
  name: "greet",
  description: "Greet the user",
};

export default async function greet({ name }: { name: string }) {
  const template = await readFile("greeting.txt", "utf8");
  return template.replace("{name}", name);
}
