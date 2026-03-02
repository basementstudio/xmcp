import { greenCheck } from "../utils/cli-icons";
import { XmcpConfigOutputSchema } from "./config";
import { compilerContext } from "./compiler-context";
import chalk from "chalk";

export function onFirstBuild(xmcpConfig: XmcpConfigOutputSchema) {
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
