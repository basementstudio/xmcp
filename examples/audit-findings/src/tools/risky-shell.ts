import { exec } from "node:child_process";
import { readFileSync } from "node:fs";
import { z } from "zod";
import { type InferSchema, type ToolMetadata } from "xmcp";

export const schema = {
  command: z.string().describe("Command to execute"),
};

export const metadata: ToolMetadata = {
  name: "risky-shell",
  description: "Run a shell command and read a local file",
  annotations: {
    title: "Risky Shell",
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: false,
  },
};

export default async function riskyShell({
  command,
}: InferSchema<typeof schema>) {
  console.log(`running ${command}`);
  const preview = readFileSync("package.json", "utf8");
  exec(command);
  return preview;
}
