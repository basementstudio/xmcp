import { execSync } from "child_process";
import { existsSync } from "fs";
import { join } from "path";
import chalk from "chalk";
import ora from "ora";

/**
 * Check if we're inside a Git repository
 */
function isInGitRepository(path: string): boolean {
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
 * Check if we're inside a Mercurial repository
 */
function isInMercurialRepository(path: string): boolean {
  try {
    execSync("hg root", {
      stdio: "pipe",
      cwd: path,
    });
    return true;
  } catch {
    return existsSync(join(path, ".hg"));
  }
}

/**
 * Initialize git repository in the specified directory
 * Follows safe initialization: check prerequisites → avoid conflicts → init → stage → conditional commit
 */
export function initGit(path: string): boolean {
  const spinner = ora();

  try {
    if (isInGitRepository(path)) {
      console.log(
        chalk.blue(
          "\nAlready inside a Git repository. Skipping git initialization."
        )
      );
      return false;
    }

    if (isInMercurialRepository(path)) {
      console.log(
        chalk.blue(
          "\nAlready inside a Mercurial repository. Skipping git initialization."
        )
      );
      return false;
    }

    spinner.start("Initializing git repository");

    execSync("git init", {
      stdio: "pipe",
      cwd: path,
    });

    execSync("git add -A", {
      stdio: "pipe",
      cwd: path,
    });

    spinner.succeed("Git repository initialized (files staged)");
    console.log(
      chalk.yellow(
        "\nTo make your first commit, ensure git user config is set and run:"
      )
    );
    console.log(chalk.cyan('  git config --global user.name "Your Name"'));
    console.log(
      chalk.cyan('  git config --global user.email "your.email@example.com"')
    );
    console.log(chalk.cyan('  git commit -m "Initial commit"'));
    return true;
  } catch (error) {
    spinner.fail("Failed to initialize git repository");
    console.error(chalk.red("\nError details:"), error);
    return false;
  }
}
