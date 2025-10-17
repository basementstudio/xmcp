import chalk from "chalk";

/**
 * Check if the Node.js version is supported
 */
export function checkNodeVersion(): void {
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split(".")[0]);

  if (majorVersion < 20) {
    console.error(
      chalk.red(`❌ Node.js version ${nodeVersion} is not supported.`)
    );
    console.error(chalk.red(`xmcp requires Node.js 20 or higher.`));
    console.error(
      chalk.yellow(`Please upgrade your Node.js version and try again.`)
    );
    console.error(
      chalk.blue(`Visit https://nodejs.org/ to download the latest version.`)
    );
    process.exit(1);
  }
}
