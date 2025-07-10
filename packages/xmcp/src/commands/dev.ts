import { Command } from "commander";
import { compile } from "../compiler";
import { xmcpLogo } from "../utils/cli-icons";
import { compilerContextProvider } from "../compiler/compiler-context";

export function createDevCommand(): Command {
  const devCommand = new Command("dev")
    .description("Start development mode")
    .action(() => {
      console.log(`${xmcpLogo} Starting development mode...`);
      compilerContextProvider(
        {
          mode: "development",
          // Ignore platforms on dev mode
          platforms: {},
        },
        () => {
          compile();
        }
      );
    });

  return devCommand;
}
