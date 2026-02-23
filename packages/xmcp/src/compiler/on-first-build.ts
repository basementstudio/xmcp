import { spawn } from "child_process";
import { CompilerMode } from ".";
import { watchdog } from "../utils/spawn-process";
import { greenCheck } from "../utils/cli-icons";
import { XmcpConfigOutputSchema } from "./config";
import { compilerContext } from "./compiler-context";
import chalk from "chalk";

export function onFirstBuild(
  mode: CompilerMode,
  xmcpConfig: XmcpConfigOutputSchema
) {
  if (mode === "development" && false) {
    // disable inspector for now
    console.log("🔍 Starting inspector...");

    const inspectorArgs = ["@modelcontextprotocol/inspector@latest"];

    if (xmcpConfig.stdio) {
      inspectorArgs.push("node", "dist/stdio.js");
    }

    const inspectorProcess = spawn("npx", inspectorArgs, {
      stdio: ["inherit", "pipe", "pipe"],
      shell: true,
    });

    watchdog(inspectorProcess);

    // Prefix inspector output with [Inspector]
    inspectorProcess.stdout?.on("data", (data: Buffer) => {
      const lines = data.toString().split("\n");
      lines.forEach((line) => {
        if (line.trim()) {
          if (line.includes("?MCP_PROXY_AUTH_TOKEN")) {
            console.log(`🔍 Inspector started at ${line}`);
          }
        }
      });
    });

    inspectorProcess.stderr?.on("data", (data: Buffer) => {
      const lines = data.toString().split("\n");
      lines.forEach((line) => {
        if (line.trim()) {
          console.error(`[Inspector] ${line}`);
        }
      });
    });

    inspectorProcess.on("error", (err: Error) => {
      console.error("[Inspector] Failed to start inspector:", err);
    });
  }

  const builtResults = [];

  if (xmcpConfig.stdio) {
    builtResults.push(`${greenCheck} Built STDIO server`);
  }
  if (xmcpConfig["http"]) {
    if (xmcpConfig.experimental?.adapter) {
      builtResults.push(`${greenCheck} Built Adapter`);
    } else {
      builtResults.push(`${greenCheck} Built HTTP server`);
    }
  }

  builtResults.forEach((result) => {
    console.log(result);
  });

  logBuildSummary();
}

function logBuildSummary() {
  const { toolPaths, promptPaths, resourcePaths } =
    compilerContext.getContext();
  const toolsCount = toolPaths.size;
  const promptsCount = promptPaths.size;
  const resourcesCount = resourcePaths.size;

  const parts: string[] = [];
  if (toolsCount > 0) {
    parts.push(`${chalk.bold(toolsCount)} tool${toolsCount !== 1 ? "s" : ""}`);
  }
  if (promptsCount > 0) {
    parts.push(
      `${chalk.bold(promptsCount)} prompt${promptsCount !== 1 ? "s" : ""}`
    );
  }
  if (resourcesCount > 0) {
    parts.push(
      `${chalk.bold(resourcesCount)} resource${resourcesCount !== 1 ? "s" : ""}`
    );
  }

  if (parts.length > 0) {
    console.log(`${greenCheck} Registered ${parts.join(", ")}`);
  } else {
    console.log(`${greenCheck} No tools, prompts, or resources registered`);
  }
}
