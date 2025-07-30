import { execSync } from "child_process";
import path from "path";
import chalk from "chalk";
import fs from "fs-extra";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.join(__dirname, "..");

export async function buildMain() {
  console.log(chalk.bgBlue.bold("Building Main Package"));

  try {
    // Clean dist directory
    const distPath = path.join(packageRoot, "dist");
    if (fs.existsSync(distPath)) {
      fs.removeSync(distPath);
    }

    // Compile TypeScript
    execSync("npx tsc", {
      cwd: packageRoot,
      stdio: "inherit",
    });

    console.log(chalk.green("✅ Main package build completed"));
  } catch (error) {
    console.error(chalk.red("❌ Main package build failed:"), error);
    throw error;
  }
}
