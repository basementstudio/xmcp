import path from "path";
import fs from "fs-extra";
import chalk from "chalk";
import { readTsConfigFile } from "../utils/read-config-file.js";

/**
 * updates the tsconfig.json file to include the @xmcp/* alias for accessing the handler
 * @param projectRoot - The root directory of the project
 * @returns void
 */
export function updateTsConfig(projectRoot: string) {
  const tsconfigPath = path.join(projectRoot, "tsconfig.json");
  
  let tsconfig: any;
  try {
    tsconfig = readTsConfigFile(tsconfigPath);
  } catch (error) {
    console.log(
      chalk.yellow(`Failed to parse tsconfig.json: ${error instanceof Error ? error.message : "Unknown error"}`)
    );
    return;
  }

  if (!tsconfig) {
    console.log(
      chalk.yellow("No tsconfig.json file found - skipping alias configuration")
    );
    return;
  }

  // there's a file, but it's empty - we can add the compiler options and paths
  if (!tsconfig.compilerOptions) {
    tsconfig.compilerOptions = {};
  }

  if (!tsconfig.compilerOptions.paths) {
    tsconfig.compilerOptions.paths = {};
  }

  // alias for accessing the handler, otherwise should be pointing to .xmcp/adapter when importing it
  if (!tsconfig.compilerOptions.paths["@xmcp/*"]) {
    tsconfig.compilerOptions.paths["@xmcp/*"] = ["./.xmcp/*"];
  }

  if (!tsconfig.include) {
    tsconfig.include = [];
  }

  if (!tsconfig.include.includes("xmcp-env.d.ts")) {
    // include xmcp-env.d.ts in the build
    tsconfig.include.push("xmcp-env.d.ts");
  }

  fs.writeJsonSync(tsconfigPath, tsconfig, { spaces: 2 });
}
