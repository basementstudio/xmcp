// Based on https://gist.github.com/nerdyman/2f97b24ab826623bff9202750013f99e

import path from "path";
import { readFileSync, existsSync } from "fs";
import { parseJson } from "@/utils/fs-utils";

/**
 * Resolve tsconfig.json paths to Rspack aliases
 * @param  {string} tsconfigPath           - Path to tsconfig
 * @param  {string} bundlerConfigBasePath  - Path from tsconfig to bundler config to create absolute aliases
 * @return {object}                        - bundler alias config
 */
export function resolveTsconfigPathsToAlias({
  tsconfigPath = "./tsconfig.json",
} = {}) {
  if (!existsSync(tsconfigPath)) {
    return {};
  }
  const tsconfigContent = readFileSync(tsconfigPath, "utf-8");
  const [parsedTsconfig, parsingError] = parseJson(tsconfigContent);

  if (parsingError) {
    console.error(
      `Error parsing tsconfig.json: ${parsingError.message} at ${tsconfigPath}`
    );
    console.log(tsconfigContent);
    return {};
  }

  if (
    !parsedTsconfig.compilerOptions ||
    !parsedTsconfig.compilerOptions.paths
  ) {
    return {};
  }

  const paths = parsedTsconfig.compilerOptions.paths;

  const aliases: Record<string, string> = {};

  Object.keys(paths).forEach((item) => {
    const key = item.replace("/*", "");
    const value = path.resolve(
      paths[item][0].replace("/*", "").replace("*", "")
    );

    aliases[key] = value;
  });

  return aliases;
}
