#!/usr/bin/env node

import path from "path";
import fs from "fs-extra";
import chalk from "chalk";
import { Command } from "commander";
import inquirer from "inquirer";
import ora from "ora";
import { fileURLToPath } from "url";
import { checkNodeVersion } from "./utils/check-node.js";
import { createProject } from "./helpers/create.js";
import { isFolderEmpty } from "./utils/is-folder-empty.js";
import { downloadAndExtractExample, listExamples } from "./helpers/examples.js";

checkNodeVersion();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../package.json"), "utf8")
);

const program = new Command()
  .name("create-xmcp-app")
  .description("Create a new xmcp application")
  .version(
    packageJson.version,
    "-v, --version",
    "Output the current version of create-xmcp-app."
  )
  .argument("[directory]")
  .usage("[directory] [options]")
  .option("--example <example>", "Download and extract an example/template")
  .option("--list-examples", "List all available examples/templates")
  .helpOption("-h, --help", "Display help message.")
  .option("-y, --yes", "Skip confirmation prompt", false)
  .option("--use-npm", "Use npm as package manager (default: use npm)")
  .option("--use-yarn", "Use yarn as package manager")
  .option("--use-pnpm", "Use pnpm as package manager")
  .option("--use-bun", "Use bun as package manager")
  .option("--skip-install", "Skip installing dependencies", false)
  .option("--http", "Enable HTTP transport", false)
  .option("--stdio", "Enable STDIO transport", false)
  .option("--gpt", "Initialize with GPT App template", false)
  .option("--ui", "Initialize with MCP App template", false)
  .option(
    "--tailwind, --tw",
    "Use Tailwind CSS (only with --gpt or --ui)",
    false
  )
  .action(async (projectDir, options) => {
    console.log(chalk.bold(`\ncreate-xmcp-app@${packageJson.version}`));

    if (options.tailwind && !options.gpt && !options.ui) {
      options.ui = true;
    }

    if (options.listExamples) {
      await listExamples();
      process.exit(0);
    }

    if (options.example) {
      const targetPath = process.cwd();
      await downloadAndExtractExample(targetPath, options.example);

      console.log();
      console.log("Next steps:");
      console.log(`  ${chalk.cyan("npm install")}`);
      console.log(`  ${chalk.cyan("npm run dev")}`);
      console.log();
      console.log("To learn more about xmcp:");
      console.log(`  - Read the documentation at https://xmcp.dev/docs\n`);
      process.exit(0);
    }

    // If project directory wasn't specified, ask for it
    if (!projectDir) {
      const answers = await inquirer.prompt([
        {
          type: "input",
          name: "projectDir",
          message: "What is your project named?",
          default: "my-xmcp-app",
        },
      ]);
      projectDir = answers.projectDir;
    }

    // Normalize project directory
    const resolvedProjectPath = path.resolve(process.cwd(), projectDir);
    const projectName = path.basename(resolvedProjectPath);

    // Check if directory exists
    if (fs.existsSync(resolvedProjectPath)) {
      const stats = fs.statSync(resolvedProjectPath);
      if (!stats.isDirectory()) {
        console.error(
          chalk.red(`Error: ${projectName} exists but is not a directory.`)
        );
        process.exit(1);
      }

      // Check if directory is empty
      if (!isFolderEmpty(resolvedProjectPath, projectName)) {
        console.error(
          chalk.red(`The directory ${resolvedProjectPath} is not empty.`)
        );
        process.exit(1);
      }
    }

    let packageManager = "npm";
    let skipInstall = options.skipInstall;
    let transports = ["http"];
    let selectedPaths = ["tools", "prompts", "resources"];
    let template = "typescript";
    let templateChoice = "default";
    let tailwind = false;

    // Handle --gpt flag
    if (options.gpt) {
      template = "gpt-apps";
      transports = ["http"];
      selectedPaths = ["tools"];
      templateChoice = "gpt-app";
      tailwind = options.tailwind || false;
    }

    // Handle --ui flag
    if (options.ui) {
      template = "mcp-apps";
      transports = ["http"];
      selectedPaths = ["tools"];
      templateChoice = "mcp-app";
      tailwind = options.tailwind || false;
    }

    if (!options.gpt && !options.ui && (options.http || options.stdio)) {
      transports = [];
      if (options.http) transports.push("http");
      if (options.stdio) transports.push("stdio");
    }

    if (!options.yes) {
      if (!options.gpt && !options.ui) {
        const templateAnswers = await inquirer.prompt([
          {
            type: "list",
            name: "template",
            message: "Select a template:",
            choices: [
              {
                name: "Default (Standard MCP server)",
                value: "default",
              },
              {
                name: "GPT App (ChatGPT/OpenAI widgets)",
                value: "gpt-app",
              },
              {
                name: "MCP App (React widgets for ext-apps)",
                value: "mcp-app",
              },
            ],
            default: "default",
          },
        ]);
        templateChoice = templateAnswers.template;

        if (templateChoice === "gpt-app") {
          template = "gpt-apps";
          transports = ["http"];
          selectedPaths = ["tools"];
        } else if (templateChoice === "mcp-app") {
          template = "mcp-apps";
          transports = ["http"];
          selectedPaths = ["tools"];
        }

        if (
          (templateChoice === "gpt-app" || templateChoice === "mcp-app") &&
          !options.tailwind
        ) {
          const tailwindAnswers = await inquirer.prompt([
            {
              type: "confirm",
              name: "tailwind",
              message: "Would you like to use Tailwind CSS?",
              default: true,
            },
          ]);
          tailwind = tailwindAnswers.tailwind;
        }
      }

      if (options.useYarn) packageManager = "yarn";
      if (options.usePnpm) packageManager = "pnpm";
      if (options.useBun) packageManager = "bun";

      if (
        !options.useYarn &&
        !options.usePnpm &&
        !options.useBun &&
        !options.useNpm
      ) {
        const pmAnswers = await inquirer.prompt([
          {
            type: "list",
            name: "packageManager",
            message: "Select a package manager:",
            choices: [
              { name: "npm", value: "npm" },
              { name: "yarn", value: "yarn" },
              { name: "pnpm", value: "pnpm" },
              { name: "bun", value: "bun" },
            ],
            default: "npm",
          },
        ]);
        packageManager = pmAnswers.packageManager;
      }

      if (templateChoice === "default" && !options.http && !options.stdio) {
        const transportAnswers = await inquirer.prompt([
          {
            type: "list",
            name: "transport",
            message: "Select the transport you want to use:",
            choices: [
              {
                name: "HTTP (runs on a server)",
                value: "http",
              },
              {
                name: "STDIO (runs on the user's machine)",
                value: "stdio",
              },
            ],
            default: "http",
          },
        ]);
        transports = [transportAnswers.transport];
      }

      // Path selection checklist (only for none template)
      if (templateChoice === "default") {
        const pathAnswers = await inquirer.prompt([
          {
            type: "checkbox",
            name: "paths",
            message: "Select components to initialize:",
            choices: [
              {
                name: "Tools",
                value: "tools",
                checked: true,
              },
              {
                name: "Prompts",
                value: "prompts",
                checked: true,
              },
              {
                name: "Resources",
                value: "resources",
                checked: true,
              },
            ],
          },
        ]);
        selectedPaths = pathAnswers.paths;
      }

      console.log();
      console.log(
        `Creating a new xmcp app in ${chalk.green(resolvedProjectPath)}.\n`
      );

      const { confirmed } = await inquirer.prompt([
        {
          type: "confirm",
          name: "confirmed",
          message: "Ok to continue?",
          default: true,
        },
      ]);

      if (!confirmed) {
        console.log(chalk.yellow("Aborting installation."));
        process.exit(0);
      }
    } else {
      // Use command-line options when --yes is provided
      if (options.useYarn) packageManager = "yarn";
      if (options.usePnpm) packageManager = "pnpm";
      if (options.useBun) packageManager = "bun";

      // Use all paths by default in non-interactive mode (unless template is set)
      if (templateChoice === "default") {
        selectedPaths = ["tools", "prompts", "resources"];
      }

      // Default to Tailwind for GPT and UI templates in non-interactive mode
      if (templateChoice === "gpt-app" || templateChoice === "mcp-app") {
        tailwind = true;
      }
    }

    const spinner = ora("Creating your xmcp app...").start();
    try {
      createProject({
        projectPath: resolvedProjectPath,
        projectName,
        packageManager,
        transports: transports,
        packageVersion: packageJson.version,
        skipInstall,
        paths: selectedPaths,
        template,
        tailwind,
      });

      spinner.succeed(chalk.green("Your xmcp app is ready"));

      console.log();
      console.log("Next steps:");

      if (resolvedProjectPath !== process.cwd()) {
        console.log(`  cd ${chalk.cyan(projectDir)}`);
      }

      if (packageManager === "yarn") {
        skipInstall && console.log(`  ${chalk.cyan("yarn install")}`);
        console.log(`  ${chalk.cyan("yarn dev")}`);
      } else if (packageManager === "pnpm") {
        skipInstall && console.log(`  ${chalk.cyan("pnpm install")}`);
        console.log(`  ${chalk.cyan("pnpm dev")}`);
      } else if (packageManager === "bun") {
        skipInstall && console.log(`  ${chalk.cyan("bun install")}`);
        console.log(`  ${chalk.cyan("bun dev")}`);
      } else {
        skipInstall && console.log(`  ${chalk.cyan("npm install")}`);
        console.log(`  ${chalk.cyan("npm run dev")}`);
      }

      console.log();
      console.log("To learn more about xmcp:");
      console.log(`  - Read the documentation at https://xmcp.dev/docs\n`);
    } catch (error) {
      spinner.fail(chalk.red("Failed to create the project."));
      console.error(error);
      process.exit(1);
    }
  });

program.parse(process.argv);
