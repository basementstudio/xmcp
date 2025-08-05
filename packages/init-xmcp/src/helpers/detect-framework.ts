import chalk from "chalk";
import fs from "fs-extra";
import path from "path";
import { readTsConfigFile } from "../utils/read-config-file.js";

export type Framework = "nextjs" | "express";

export function detectFramework(projectRoot: string): Framework {
  // check if project has been initialized with nextjs or default to express
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(projectRoot, "package.json"), "utf-8")
  );

  if (!packageJson.dependencies?.next && !packageJson.devDependencies?.next) {
    return "express";
  }

  return "nextjs";
}

export function detectTypeScript(projectRoot: string): boolean {
  // check if project has been initialized with typescript or default to javascript
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(projectRoot, "package.json"), "utf-8")
  );

  if (
    !packageJson.devDependencies?.typescript &&
    !packageJson.dependencies?.typescript
  ) {
    console.log(
      chalk.yellow(
        "Please initialize xmcp within a TypeScript project. Missing dependency: typescript"
      )
    );
    return false;
  }

  // if typescript is in the dependencies, check for tsconfig.json and validate it
  if (fs.existsSync(path.join(projectRoot, "tsconfig.json"))) {
    try {
      const tsconfigPath = path.join(projectRoot, "tsconfig.json");
      const tsconfigContent = readTsConfigFile(tsconfigPath);
      return typeof tsconfigContent === "object" && tsconfigContent !== null;
    } catch (error) {
      console.log(
        chalk.yellow(
          `Please initialize xmcp within a TypeScript project. ${error instanceof Error ? error.message : "Invalid tsconfig.json file"}`
        )
      );
      return false;
    }
  }

  console.log(
    chalk.yellow(
      "Please initialize xmcp within a TypeScript project. Missing file: tsconfig.json"
    )
  );

  return false;
}
