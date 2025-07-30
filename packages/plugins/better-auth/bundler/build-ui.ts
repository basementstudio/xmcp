import { execSync } from "child_process";
import path from "path";
import chalk from "chalk";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.join(__dirname, "..");

export async function buildUI() {
  console.log(chalk.bgBlue.bold("Building UI with Vite"));

  try {
    // Build the UI using Vite
    execSync("pnpm run build:ui", {
      cwd: packageRoot,
      stdio: "inherit",
    });

    console.log(chalk.green("✅ UI build completed"));
  } catch (error) {
    console.error(chalk.red("❌ UI build failed:"), error);
    throw error;
  }
}
