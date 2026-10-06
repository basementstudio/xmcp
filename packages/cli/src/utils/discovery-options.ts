export interface DiscoveryOptions {
  target?: string;
  stdio?: { command: string; args: string[] };
  clientsFile?: string;
  json: boolean;
  help: boolean;
}

export function parseDiscoveryOptions(args: string[]): DiscoveryOptions {
  const options: DiscoveryOptions = { json: false, help: false };
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    switch (arg) {
      case "--json":
        options.json = true;
        break;
      case "-h":
      case "--help":
        options.help = true;
        break;
      case "-c":
      case "--clients": {
        const value = args[++index];
        if (!value || value.startsWith("-"))
          throw new Error(`${arg} requires a file path.`);
        options.clientsFile = value;
        break;
      }
      case "--stdio": {
        const command = args[++index];
        if (!command || command.startsWith("-"))
          throw new Error("--stdio requires an executable.");
        options.stdio = { command, args: args.slice(index + 1) };
        // Everything after the executable belongs to the subprocess, including
        // flags such as --help and --json. CLI options must precede --stdio.
        index = args.length;
        break;
      }
      default:
        if (arg.startsWith("-")) throw new Error(`Unknown option "${arg}".`);
        if (options.target)
          throw new Error("Specify exactly one URL or client name.");
        options.target = arg;
    }
  }
  if (options.target && options.stdio)
    throw new Error("Use either a URL/client name or --stdio, not both.");
  if (!options.help && !options.target && !options.stdio)
    throw new Error(
      "Specify a server URL, a client name, or --stdio <cmd> [args]."
    );
  return options;
}
