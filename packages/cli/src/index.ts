#!/usr/bin/env node

interface ParsedArgs {
  command?: string;
  subcommand?: string;
  positional: string[];
  options: Record<string, string | boolean | undefined>;
  helpRequested: boolean;
}

const HELP_TEXT = `xmcp Developer CLI

Usage:
  npx @xmcp-dev/cli <command> [options]

Commands:
  generate                     Generate typed remote tool client files
  create <type> [name]         Scaffold a new tool, resource, or prompt
  inspect <target>             Show MCP server details and capabilities
  list <target>                List tools, prompts, resources, and templates

Inspect / list options:
  <target>                    HTTP(S) URL or client name from src/clients.ts
  -c, --clients <path>         Path to a named-client config
  --json                      Print a JSON result
  --stdio <cmd> [args]         Spawn a server; put all CLI options before --stdio

Generate options:
  -o, --out <path>             Output directory (default: src/generated)
  -c, --clients <path>         Path to clients config (default: src/clients.ts)

Create options:
  -d, --dir <path>             Output directory override
  -p, --preset <preset>        Template preset: standard | react

Global options:
  -h, --help                   Show this help message
`;

function parseArgs(argv: string[]): ParsedArgs {
  const [, , maybeCommand, maybeSubcommand, ...rest] = argv;
  const options: Record<string, string | boolean> = {};
  const positional: string[] = [];
  let helpRequested = false;

  const command =
    maybeCommand && !maybeCommand.startsWith("-") ? maybeCommand : undefined;
  const commandArgs = command
    ? [maybeSubcommand, ...rest]
    : [maybeCommand, maybeSubcommand, ...rest];

  let subcommand: string | undefined;

  for (let i = 0; i < commandArgs.length; i++) {
    const arg = commandArgs[i];
    if (!arg) continue;

    switch (arg) {
      case "-h":
      case "--help":
        helpRequested = true;
        break;
      case "-o":
      case "--out":
        options.out = commandArgs[++i];
        break;
      case "-c":
      case "--clients":
        options.clients = commandArgs[++i];
        break;
      case "-d":
      case "--dir":
        options.dir = commandArgs[++i];
        break;
      case "-p":
      case "--preset":
        options.preset = commandArgs[++i];
        break;
      default:
        if (!arg.startsWith("-")) {
          if (!subcommand) {
            subcommand = arg;
          } else {
            positional.push(arg);
          }
        }
        break;
    }
  }

  return { command, subcommand, positional, options, helpRequested };
}

function printHelp() {
  console.log(HELP_TEXT);
}

async function main() {
  if (process.argv[2] === "inspect" || process.argv[2] === "list") {
    const { parseDiscoveryOptions } =
      await import("./utils/discovery-options.js");
    const discovery = parseDiscoveryOptions(process.argv.slice(3));
    if (discovery.help) return printHelp();
    // Config files and dependencies may log while loading. Reserve stdout for
    // the final result so --json stays parseable, including on failure.
    const stdoutWrite = process.stdout.write;
    let output: string;
    process.stdout.write = process.stderr.write.bind(process.stderr);
    try {
      if (process.argv[2] === "inspect") {
        const { runInspect, formatInspection } =
          await import("./commands/inspect.js");
        const result = await runInspect(discovery);
        output = discovery.json
          ? JSON.stringify(result, null, 2)
          : formatInspection(result);
      } else {
        const { runList, formatCatalog } = await import("./commands/list.js");
        const result = await runList(discovery);
        output = discovery.json
          ? JSON.stringify(result, null, 2)
          : formatCatalog(result);
      }
    } finally {
      process.stdout.write = stdoutWrite;
    }
    process.stdout.write(`${output}\n`);
    return;
  }
  const { command, subcommand, positional, options, helpRequested } = parseArgs(
    process.argv
  );

  if (!command || helpRequested || command === "help") {
    printHelp();
    if (command && command !== "help") {
      process.exit(1);
    }
    return;
  }

  if (command === "generate") {
    const { runGenerate } = await import("./commands/generate.js");

    await runGenerate({
      out: typeof options.out === "string" ? options.out : undefined,
      clientsFile:
        typeof options.clients === "string" ? options.clients : undefined,
    });
    return;
  }

  if (command === "create") {
    if (!subcommand) {
      console.error("Missing create type.\n");
      printHelp();
      process.exit(1);
      return;
    }

    const { runCreate } = await import("./commands/create.js");
    const result = await runCreate({
      type: subcommand as "tool" | "resource" | "prompt",
      name: positional[0],
      preset: typeof options.preset === "string" ? options.preset : undefined,
      directory: typeof options.dir === "string" ? options.dir : undefined,
    });

    if (result.status === "skipped") {
      console.log(
        `Skipped ${subcommand} -> ${result.outputPath} (already exists)`
      );
      return;
    }

    console.log(`Created ${subcommand} -> ${result.outputPath}`);
    return;
  }

  console.error(`Unknown command "${command}".\n`);
  printHelp();
  process.exit(1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
