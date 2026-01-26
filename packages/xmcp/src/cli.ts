#!/usr/bin/env node
import { Command } from "commander";
import { compile } from "./compiler";
import { buildVercelOutput } from "./platforms/build-vercel-output";
import chalk from "chalk";
import { xmcpLogo } from "./utils/cli-icons";
import {
  compilerContext,
  compilerContextProvider,
} from "./compiler/compiler-context";
import { runCreate, type CreateType } from "./cli/commands/create";

const program = new Command();

program.name("xmcp").description("The MCP framework CLI").version("0.0.1");

program
  .command("dev")
  .description("Start development mode")
  .action(async () => {
    console.log(`${xmcpLogo} Starting development mode...`);
    await compilerContextProvider(
      {
        mode: "development",
        // Ignore platforms on dev mode
        platforms: {},
      },
      async () => {
        await compile();
      }
    );
  });

program
  .command("build")
  .description("Build for production")
  .option("--vercel", "Build for Vercel deployment")
  .action(async (options) => {
    console.log(`${xmcpLogo} Building for production...`);
    const isVercelBuild = options.vercel || process.env.VERCEL === "1";

    await compilerContextProvider(
      {
        mode: "production",
        platforms: {
          vercel: isVercelBuild,
        },
      },
      async () => {
        await compile({
          onBuild: async () => {
            const { xmcpConfig } = compilerContext.getContext();
            const isUsingAdapter = !!xmcpConfig?.experimental?.adapter;

            if (isVercelBuild && !isUsingAdapter) {
              console.log(`${xmcpLogo} Building for Vercel...`);
              try {
                await buildVercelOutput();
              } catch (error) {
                console.error(
                  chalk.red("❌ Failed to create Vercel output structure:"),
                  error
                );
              }
            }
          },
        });
      }
    );
  });

const VALID_CREATE_TYPES: CreateType[] = [
  "tool",
  "resource",
  "prompt",
  "widget",
];

program
  .command("create <type> <name>")
  .description("Scaffold a new tool, resource, prompt, or widget")
  .option("-d, --dir <path>", "Custom output directory")
  .action(async (type: string, name: string, options: { dir?: string }) => {
    if (!VALID_CREATE_TYPES.includes(type as CreateType)) {
      console.error(chalk.red(`Invalid type "${type}".`));
      console.error(`Valid types: ${VALID_CREATE_TYPES.join(", ")}`);
      process.exit(1);
    }

    try {
      const outputPath = await runCreate({
        type: type as CreateType,
        name,
        directory: options.dir,
      });
      console.log(`${xmcpLogo} Created ${type} "${name}" -> ${outputPath}`);
    } catch (error) {
      console.error(
        chalk.red(error instanceof Error ? error.message : String(error))
      );
      process.exit(1);
    }
  });

program.parse();
