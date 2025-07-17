import { execSync } from "child_process";
import chalk from "chalk";
import ora from "ora";

/**
 * Check if git is installed on the system
 */
function isGitInstalled(): boolean {
  try {
    execSync("git --version", { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if git user config is set
 */
function hasGitUserConfig(): boolean {
  try {
    const userName = execSync("git config user.name", { stdio: "pipe" })
      .toString()
      .trim();
    const userEmail = execSync("git config user.email", { stdio: "pipe" })
      .toString()
      .trim();
    return Boolean(userName && userEmail);
  } catch {
    return false;
  }
}

/**
 * Check if a directory is inside a git repository
 */
function isInsideGitRepo(path: string): boolean {
  try {
    execSync("git rev-parse --git-dir", {
      stdio: "pipe",
      cwd: path,
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Initialize git repository in the specified directory
 */
export function initGit(path: string): boolean {
  const spinner = ora();

  try {
    // Check if git is installed
    if (!isGitInstalled()) {
      console.log(
        chalk.yellow("\nGit is not installed. Skipping git initialization.")
      );
      return false;
    }

    // Check if already in a git repo
    if (isInsideGitRepo(path)) {
      console.log(
        chalk.blue(
          "\nAlready inside a git repository. Skipping git initialization."
        )
      );
      return false;
    }

    spinner.start("Initializing git repository");

    // Initialize git
    execSync("git init", {
      stdio: "pipe",
      cwd: path,
    });

    // Stage all files
    execSync("git add -A", {
      stdio: "pipe",
      cwd: path,
    });

    // Check if git user config exists before committing
    if (hasGitUserConfig()) {
      execSync('git commit -m "Initial commit from create-xmcp-app"', {
        stdio: "pipe",
        cwd: path,
      });
      spinner.succeed("Git repository initialized with initial commit");
    } else {
      spinner.succeed("Git repository initialized (files staged)");
      console.log(
        chalk.yellow(
          "\nGit user configuration not found. To make your first commit, run:"
        )
      );
      console.log(chalk.cyan('  git config --global user.name "Your Name"'));
      console.log(
        chalk.cyan('  git config --global user.email "your.email@example.com"')
      );
      console.log(chalk.cyan('  git commit -m "Initial commit"'));
    }
    return true;
  } catch (error) {
    spinner.fail("Failed to initialize git repository");
    console.error(chalk.red("\nError details:"), error);
    return false;
  }
}
