import path from "path";
import fs from "fs-extra";
import chalk from "chalk";
import { readTsConfigFile } from "../utils/read-config-file.js";

type TsConfig = {
  compilerOptions?: Record<string, any>;
  include?: string[] | string;
  [key: string]: any;
};

/**
 * updates the tsconfig.json file to include the @xmcp/* alias for accessing the handler
 * @param projectRoot - The root directory of the project
 * @returns void
 */
export function updateTsConfig(projectRoot: string) {
  const tsconfigPath = path.join(projectRoot, "tsconfig.json");

  let tsconfig: TsConfig | undefined;
  try {
    tsconfig = readTsConfigFile(tsconfigPath);
  } catch (error) {
    console.log(
      chalk.yellow(
        `Failed to parse tsconfig.json: ${error instanceof Error ? error.message : "Unknown error"}`
      )
    );
    return;
  }

  if (!tsconfig) {
    console.log(
      chalk.yellow("No tsconfig.json file found - skipping alias configuration")
    );
    return;
  }

  const compilerOptions =
    tsconfig.compilerOptions && typeof tsconfig.compilerOptions === "object"
      ? tsconfig.compilerOptions
      : {};

  const paths =
    compilerOptions.paths && typeof compilerOptions.paths === "object"
      ? compilerOptions.paths
      : {};

  const updatedTsconfig: TsConfig = {
    ...tsconfig,
    compilerOptions: {
      ...compilerOptions,
      paths: {
        ...paths,
        "@xmcp/*": ["./.xmcp/*"],
      },
    },
  };

  const includeEntries = Array.isArray(tsconfig.include)
    ? tsconfig.include
    : tsconfig.include
      ? [tsconfig.include]
      : [];

  if (!includeEntries.includes("xmcp-env.d.ts")) {
    updatedTsconfig.include = [...includeEntries, "xmcp-env.d.ts"];
  } else if (tsconfig.include) {
    updatedTsconfig.include = tsconfig.include;
  }

  fs.writeJsonSync(tsconfigPath, updatedTsconfig, { spaces: 2 });
}
