import { execSync } from "child_process";

/**
 * Get the appropriate install command for the selected package manager
 * @param packageManager - Package manager name (npm, yarn, pnpm, or bun)
 * @returns Install command string with appropriate flags
 */
function getInstallCommand(
  packageManager: string,
  packageVersion: string
): string {
  switch (packageManager) {
    case "yarn":
      // Add --check-engines flag to enforce Node version requirement
      return `yarn install --check-engines xmcp@${packageVersion}`;
    case "pnpm":
      return `pnpm install xmcp@${packageVersion}`;
    case "bun":
      return `bun install xmcp@${packageVersion}`;
    case "npm":
    default:
      // npm automatically checks engines by default
      return `npm install xmcp@${packageVersion}`;
  }
}

/**
 * Install project dependencies using the specified package manager
 * @param projectPath - Project directory path where dependencies should be installed
 * @param packageManager - Package manager to use (npm, yarn, pnpm, or bun)
 */
export function install(
  projectPath: string,
  packageManager: string,
  packageVersion: string
): void {
  const installCommand = getInstallCommand(packageManager, packageVersion);
  execSync(installCommand, { cwd: projectPath, stdio: "inherit" });
}
