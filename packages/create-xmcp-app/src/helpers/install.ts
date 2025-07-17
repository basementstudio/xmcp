import { execSync } from "child_process";

/**
 * Get the appropriate install command for the selected package manager
 * @param packageManager - Package manager name (npm, yarn, or pnpm)
 * @returns Install command string with appropriate flags
 */
function getInstallCommand(packageManager: string): string {
  switch (packageManager) {
    case "yarn":
      // Add --check-engines flag to enforce Node version requirement
      return "yarn install --check-engines xmcp@latest";
    case "pnpm":
      return "pnpm install xmcp@latest";
    case "bun":
      return "bun install xmcp@latest";
    case "npm":
    default:
      // npm automatically checks engines by default
      return "npm install xmcp@latest";
  }
}

/**
 * Install project dependencies using the specified package manager
 * @param projectPath - Project directory path where dependencies should be installed
 * @param packageManager - Package manager to use (npm, yarn, or pnpm)
 */
export function install(projectPath: string, packageManager: string): void {
  const installCommand = getInstallCommand(packageManager);
  execSync(installCommand, { cwd: projectPath, stdio: "inherit" });
}
