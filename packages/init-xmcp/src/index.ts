#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import inquirer from "inquirer";
import { init } from "./helpers/init.js";
import {
  detectFramework,
  detectTypeScript,
} from "./helpers/detect-framework.js";
import { detectPackageManager } from "./helpers/install.js";
import fs from "fs-extra";
import path from "path";
import { checkNodeVersion } from "./utils/check-node.js";
import { fileURLToPath } from "url";

checkNodeVersion();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../package.json"), "utf8")
);

const program = new Command()
  .name("init-xmcp")
  .description("Initialize xmcp in an existing project")
  .version(
    packageJson.version,
    "-v, --version",
    "Output the current version of init-xmcp."
  )
  .helpOption("-h, --help", "Display help message.")
  .option("-y, --yes", "Skip confirmation prompts", false)
  .option(
    "--package-manager <manager>",
    "Specify package manager (npm, yarn, pnpm, bun)",
    ""
  )
  .option("--tools-path <path>", "Specify custom tools path", "")
  .option("--prompts-path <path>", "Specify custom prompts path", "")
  .option("--resources-path <path>", "Specify custom resources path", "")
  .option("--route-path <path>", "Specify custom route path", "")
  .option("--skip-tools", "Skip tool creation", false)
  .option("--skip-prompts", "Skip prompt creation", false)
  .option("--skip-resources", "Skip resource creation", false)
  .option("--skip-route", "Skip route creation", false)
  .action(async (options) => {
    console.log(chalk.bold(`\ninit-xmcp@${packageJson.version}`));

    const projectRoot = process.cwd();

    // check if it's a node js project
    if (!fs.existsSync(path.join(projectRoot, "package.json"))) {
      console.error(
        chalk.red(
          "Error: No package.json found. Please run this command in a Node.js project."
        )
      );
      process.exit(1);
    }

    // check if xmcp is already initialized
    if (
      fs.existsSync(path.join(projectRoot, "xmcp.config.ts")) ||
      fs.existsSync(path.join(projectRoot, "xmcp.config.json"))
    ) {
      console.error(
        chalk.red("Error: xmcp is already initialized in this project.")
      );
      process.exit(1);
    }

    // detect framework package manager and language
    const detectedFramework = detectFramework(projectRoot);
    const detectedPackageManager = detectPackageManager(projectRoot);
    const detectedTypeScript = detectTypeScript(projectRoot);

    if (!detectedTypeScript) {
      process.exit(1);
    }

    // determine tools path
    let toolsPath: string | undefined;
    if (!options.skipTools) {
      if (options.toolsPath) {
        toolsPath = options.toolsPath;
      } else {
        // check if src folder exists and default to src/tools if it does, otherwise tools
        const hasSrcFolder = fs.existsSync(path.join(projectRoot, "src"));
        toolsPath = hasSrcFolder ? "src/tools" : "tools";
      }
    }

    // determine prompts path
    let promptsPath: string | undefined;
    if (!options.skipPrompts) {
      if (options.promptsPath) {
        promptsPath = options.promptsPath;
      } else {
        // check if src folder exists and default to src/prompts if it does, otherwise prompts
        const hasSrcFolder = fs.existsSync(path.join(projectRoot, "src"));
        promptsPath = hasSrcFolder ? "src/prompts" : "prompts";
      }
    }

    // determine resources path
    let resourcesPath: string | undefined;
    if (!options.skipResources) {
      if (options.resourcesPath) {
        resourcesPath = options.resourcesPath;
      } else {
        // check if src folder exists and default to src/resources if it does, otherwise resources
        const hasSrcFolder = fs.existsSync(path.join(projectRoot, "src"));
        resourcesPath = hasSrcFolder ? "src/resources" : "resources";
      }
    }

    // determine route path
    let routePath: string | undefined;
    if (detectedFramework === "nextjs" && !options.skipRoute) {
      if (options.routePath) {
        routePath = options.routePath;
      } else {
        // check if src folder exists and default to src/mcp if it does, otherwise mcp
        const hasSrcFolder = fs.existsSync(path.join(projectRoot, "src"));
        routePath = hasSrcFolder ? "src/app/mcp" : "app/mcp";
      }
    }

    // determine package manager
    let packageManager: "npm" | "yarn" | "pnpm" | "bun";
    if (detectedPackageManager) {
      packageManager = detectedPackageManager;
    } else if (options.packageManager) {
      packageManager = options.packageManager as
        | "npm"
        | "yarn"
        | "pnpm"
        | "bun";
    } else {
      // no package manager detected, will prompt user
      packageManager = "npm"; // default fallback
    }

    // interactive prompts if not --yes
    if (!options.yes) {
      console.log(chalk.blue("\n📋 xmcp Initialization Settings:"));
      console.log(`   Framework: ${chalk.cyan(detectedFramework)}`);

      const prompts = [];

      if (!options.skipTools) {
        prompts.push({
          type: "input",
          name: "toolsPath",
          message: "Tools directory path:",
          default: toolsPath,
        });
      }

      if (!options.skipPrompts) {
        prompts.push({
          type: "input",
          name: "promptsPath",
          message: "Prompts directory path:",
          default: promptsPath,
        });
      }

      if (!options.skipResources) {
        prompts.push({
          type: "input",
          name: "resourcesPath",
          message: "Resources directory path:",
          default: resourcesPath,
        });
      }

      if (detectedFramework === "nextjs" && !options.skipRoute) {
        prompts.push({
          type: "input",
          name: "routePath",
          message: "Route directory path:",
          default: routePath, // will not be undefined if detectedFramework is nextjs
        });
      }

      if (!detectedPackageManager) {
        prompts.push({
          type: "list",
          name: "packageManager",
          message: "Package manager:",
          choices: [
            { name: "npm", value: "npm" },
            { name: "yarn", value: "yarn" },
            { name: "pnpm", value: "pnpm" },
            { name: "bun", value: "bun" },
          ],
          default: packageManager,
        });
      } else {
        console.log(
          chalk.green(`   Package manager detected: ${packageManager}`)
        );
      }

      prompts.push({
        type: "confirm",
        name: "confirmed",
        message: "Continue with initialization?",
        default: true,
      });

      const answers = await inquirer.prompt(prompts);

      if (!answers.confirmed) {
        console.log(chalk.yellow("❌ Aborting initialization."));
        process.exit(0);
      }

      if (!options.skipTools) {
        toolsPath = answers.toolsPath;
      }
      if (!options.skipPrompts) {
        promptsPath = answers.promptsPath;
      }
      if (!options.skipResources) {
        resourcesPath = answers.resourcesPath;
      }
      if (
        detectedFramework === "nextjs" &&
        !options.skipRoute &&
        answers.routePath
      ) {
        routePath = answers.routePath;
      }
      if (!detectedPackageManager) {
        packageManager = answers.packageManager;
      }
    }

    // check if tools directory already exists and has content
    if (toolsPath) {
      const toolsDirPath = path.join(projectRoot, toolsPath);
      if (fs.existsSync(toolsDirPath)) {
        const toolsDirContent = fs.readdirSync(toolsDirPath);
        if (toolsDirContent.length > 0) {
          console.warn(
            chalk.yellow(
              `Warning: Tools directory "${toolsPath}" already exists and is not empty.`
            )
          );

          if (!options.yes) {
            const { overwrite } = await inquirer.prompt([
              {
                type: "confirm",
                name: "overwrite",
                message:
                  "Do you want to continue? Existing files will be preserved.",
                default: true,
              },
            ]);

            if (!overwrite) {
              console.log(chalk.yellow("❌ Aborting initialization."));
              process.exit(0);
            }
          }
        }
      }
    }

    // check if route directory already exists and has content
    if (routePath) {
      // means detectedFramework is nextjs
      const routeDirPath = path.join(projectRoot, routePath);
      if (fs.existsSync(routeDirPath)) {
        const routeDirContent = fs.readdirSync(routeDirPath);
        if (routeDirContent.length > 0) {
          console.warn(
            chalk.yellow(
              `Warning: Route directory "${routePath}" already exists and is not empty.`
            )
          );

          if (!options.yes) {
            const { overwrite } = await inquirer.prompt([
              {
                type: "confirm",
                name: "overwrite",
                message:
                  "Do you want to continue? Existing files will be preserved.",
                default: true,
              },
            ]);

            if (!overwrite) {
              console.log(chalk.yellow("❌ Aborting initialization."));
              process.exit(0);
            }
          }
        }
      }
    }

    try {
      console.log(chalk.blue("\n Initializing xmcp..."));

      await init({
        projectRoot,
        framework: detectedFramework,
        toolsPath,
        promptsPath,
        resourcesPath,
        routePath,
        packageManager,
        version: packageJson.version,
      });

      console.log(chalk.green("\n✔ xmcp initialized successfully!"));
      console.log(chalk.blue("\n❯ Files created:"));
      console.log(`   • xmcp.config.ts`);

      if (toolsPath) {
        console.log(`   • ${toolsPath}/greet.ts`);
      }

      if (promptsPath) {
        console.log(`   • ${promptsPath}/review-code.ts`);
      }

      if (resourcesPath) {
        console.log(`   • ${resourcesPath}/(config)/app.ts`);
        console.log(`   • ${resourcesPath}/(users)/[userId]/profile.ts`);
      }

      if (routePath) {
        console.log(`   • ${routePath}/route.ts`);
      }

      console.log(chalk.blue("\n❯ Files updated:"));
      console.log(`   • package.json`);
      console.log(`   • tsconfig.json`);

      console.log(chalk.blue("\nNext steps:"));

      // code integration for express projects (default)
      if (detectedFramework !== "nextjs") {
        const integrationCode = `import { xmcpHandler } from '@xmcp/adapter';

myApp.post("/mcp", xmcpHandler);
myApp.get("/mcp", xmcpHandler);`;

        const lines = integrationCode.split("\n");
        const maxLength = Math.max(...lines.map((line) => line.length)) + 2;

        console.log(
          "\nTo get started with the xmcpHandler in your Express application, add this code to your server:\n"
        );
        console.log(chalk.green(chalk.bgBlack(`  ${" ".repeat(maxLength)}`)));
        lines.forEach((line) => {
          const padding = " ".repeat(maxLength - line.length);
          console.log(chalk.green(chalk.bgBlack(`  ${line}${padding}`)));
        });
        console.log(chalk.green(chalk.bgBlack(`  ${" ".repeat(maxLength)}`)));
      }

      console.log(
        `   \nRun "${packageManager} run dev" to start the development server\n`
      );
    } catch (error) {
      console.error(chalk.red("\nFailed to initialize xmcp:"));
      console.error(error);
      process.exit(1);
    }
  });

program.parse();
