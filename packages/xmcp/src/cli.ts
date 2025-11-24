#!/usr/bin/env node
import { Command } from "commander";
import { compile } from "./compiler";
import { buildVercelOutput } from "./platforms/build-vercel-output";
import chalk from "chalk";
import { xmcpLogo } from "./utils/cli-icons";
import { compilerContextProvider } from "./compiler/compiler-context";

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
            if (isVercelBuild) {
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

program.parse();
