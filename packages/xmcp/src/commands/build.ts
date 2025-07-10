import { Command } from "commander";
import { compile } from "../compiler";
import { buildVercelOutput } from "../platforms/build-vercel-output";
import chalk from "chalk";
import { xmcpLogo } from "../utils/cli-icons";
import { compilerContextProvider } from "../compiler/compiler-context";

export function createBuildCommand(): Command {
  const buildCommand = new Command("build")
    .description("Build for production")
    .option("--vercel", "Build for Vercel deployment")
    .action(async (options) => {
      console.log(`${xmcpLogo} Building for production...`);
      compilerContextProvider(
        {
          mode: "production",
          platforms: {
            vercel: options.vercel,
          },
        },
        () => {
          compile({
            onBuild: async () => {
              if (options.vercel) {
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

  return buildCommand;
}
