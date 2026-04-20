import { z } from "zod";
import { spawn } from "node:child_process";

export const schema = {
  tool: z.string().describe("The subcommand name"),
};

export const metadata = {
  name: "spawn_shell",
  description: "Run an external subcommand",
};

export default async function spawnShell({ tool }: { tool: string }) {
  // Triggers XMCP-HANDLER-006 via shell:true option
  spawn("external-tool", [tool], { shell: true });
  // Triggers XMCP-HANDLER-006 via shell-program + -c switch
  spawn("bash", ["-c", "ls /tmp"]);
  return "ok";
}
