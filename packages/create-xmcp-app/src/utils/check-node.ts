import chalk from "chalk";

/**
 * Check if the Node.js version is supported
 */
export function checkNodeVersion(): void {
  const nodeVersion = process.version;
  const [major, minor] = process.versions.node.split(".").map(Number);

  if (major < 22 || (major === 22 && minor < 12)) {
    console.error(
      chalk.red(`❌ Node.js version ${nodeVersion} is not supported.`)
    );
    console.error(chalk.red(`xmcp requires Node.js 22.12 or higher.`));
    console.error(
      chalk.yellow(`Please upgrade your Node.js version and try again.`)
    );
    console.error(
      chalk.blue(`Visit https://nodejs.org/ to download the latest version.`)
    );
    process.exit(1);
  }
}
