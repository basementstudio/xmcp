import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import { execSync } from "child_process";

// based on create-xmcp-app CLI

/**
 * Detect which package manager is being used in the project
 * @param projectPath - Project directory path
 * @returns Package manager name (npm, yarn, or pnpm)
 */
export function detectPackageManager(
  projectPath: string
): "npm" | "yarn" | "pnpm" | "bun" | null {
  if (
    fs.existsSync(path.join(projectPath, "bun.lockb")) ||
    fs.existsSync(path.join(projectPath, "bun.lock"))
  ) {
    return "bun";
  }
  if (fs.existsSync(path.join(projectPath, "yarn.lock"))) {
    return "yarn";
  }
  if (fs.existsSync(path.join(projectPath, "pnpm-lock.yaml"))) {
    return "pnpm";
  }
  if (fs.existsSync(path.join(projectPath, "package-lock.json"))) {
    return "npm";
  }
  return null;
}

/**
 * Install xmcp dependencies using the specified package manager
 * @param packageManager - Package manager to use (npm, yarn, pnpm, or bun)
 */
export async function install(
  projectPath: string,
  packageManager: "npm" | "pnpm" | "yarn" | "bun"
) {
  const dependencies = ["xmcp", "zod@^3.25.76"]; // pin zod to specific version to avoid compilation errors
  const devDependencies = ["swc-loader"];

  const commands = {
    npm: `npm install ${dependencies.join(" ")} && npm install --save-dev ${devDependencies.join(" ")}`,
    pnpm: `pnpm add ${dependencies.join(" ")} && pnpm add --save-dev ${devDependencies.join(" ")}`,
    yarn: `yarn add ${dependencies.join(" ")} && yarn add --dev ${devDependencies.join(" ")}`,
    bun: `bun add ${dependencies.join(" ")} && bun add --dev ${devDependencies.join(" ")}`,
  };

  try {
    console.log(
      chalk.blue(`\nInstalling dependencies using ${packageManager}...`)
    );
    execSync(commands[packageManager], { cwd: projectPath, stdio: "inherit" });
    console.log(chalk.green("\nDependencies installed successfully!"));
  } catch (error) {
    console.error(
      chalk.red(
        "\nFailed to install dependencies. You can install them manually:"
      )
    );
    console.log(chalk.yellow(`\n${commands[packageManager]}`));
  }
}
