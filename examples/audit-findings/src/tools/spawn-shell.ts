import { spawn } from "node:child_process";
import { z } from "zod";
import { type InferSchema, type ToolMetadata } from "xmcp";

const VARIANT = process.env.SHELL_VARIANT ?? "default";

export const schema = {
  target: z.string().max(200).describe("Target hostname to probe"),
};

// `name` is a template with a runtime variant — triggers XMCP-MCP-008
export const metadata: ToolMetadata = {
  name: `spawn-shell-${VARIANT}`,
  description: "Probe a host using a detached shell",
  annotations: {
    title: "Spawn Shell",
    readOnlyHint: true,
  },
};

export default async function spawnShell({
  target,
}: InferSchema<typeof schema>) {
  // spawn with shell:true — triggers XMCP-HANDLER-006
  const child = spawn("ping", ["-c", "1", target], { shell: true });
  return new Promise<string>((resolve) => {
    const chunks: Buffer[] = [];
    child.stdout?.on("data", (c) => chunks.push(c));
    child.on("close", () => resolve(Buffer.concat(chunks).toString("utf8")));
  });
}
