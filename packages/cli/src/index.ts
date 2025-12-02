#!/usr/bin/env node
import { runGenerate } from "./commands/generate.js";

interface ParsedArgs {
  command?: string;
  options: Record<string, string | boolean | undefined>;
  helpRequested: boolean;
}

const HELP_TEXT = `xmcp Developer CLI

Usage:
  npx @xmcp-dev/cli <command> [options]

Commands:
  generate            Generate a typed remote tool client file

Options:
  -u, --url <url>     MCP server URL (overrides clients.ts)
  -o, --out <path>    Output directory (default: src/generated)
  -c, --clients <path>  Path to clients config (default: src/clients.ts)
  -h, --help          Show this help message
`;

function parseArgs(argv: string[]): ParsedArgs {
  const [, , maybeCommand, ...rest] = argv;
  const options: Record<string, string | boolean> = {};
  let helpRequested = false;

  const positionalCommand =
    maybeCommand && !maybeCommand.startsWith("-") ? maybeCommand : undefined;
  const args = positionalCommand ? rest : [maybeCommand, ...rest];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!arg) continue;

    switch (arg) {
      case "-h":
      case "--help":
        helpRequested = true;
        break;
      case "-u":
      case "--url":
        options.url = args[++i];
        break;
      case "-o":
      case "--out":
        options.out = args[++i];
        break;
      case "-c":
      case "--clients":
        options.clients = args[++i];
        break;
      default:
        // ignore unknown flags for now
        break;
    }
  }

  return { command: positionalCommand, options, helpRequested };
}

function printHelp() {
  console.log(HELP_TEXT);
}

async function main() {
  const { command, options, helpRequested } = parseArgs(process.argv);

  if (!command || helpRequested || command === "help") {
    printHelp();
    if (command && command !== "help") {
      process.exit(1);
    }
    return;
  }

  if (command !== "generate") {
    console.error(`Unknown command "${command}".\n`);
    printHelp();
    process.exit(1);
    return;
  }

  await runGenerate({
    url: typeof options.url === "string" ? options.url : undefined,
    out: typeof options.out === "string" ? options.out : undefined,
    clientsFile:
      typeof options.clients === "string" ? options.clients : undefined,
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
