import {
  parseDiscoveryOptions,
  type DiscoveryOptions,
} from "./discovery-options.js";

export type ExecutionCommand = "call" | "read-resource" | "get-prompt";
export class CliInputError extends Error {}

export interface ExecutionOptions extends DiscoveryOptions {
  command: ExecutionCommand;
  component: string;
  arguments: string[];
  argsFile?: string;
  stdin: boolean;
}

export function parseExecutionOptions(
  command: ExecutionCommand,
  args: string[]
): ExecutionOptions {
  const connection: string[] = [];
  const positional: string[] = [];
  const assignments: string[] = [];
  let argsFile: string | undefined;
  let stdin = false;
  let stdio = false;
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === "--stdio") {
      stdio = true;
      connection.push(...args.slice(index));
      break;
    }
    if (arg === "--arg") {
      const value = args[++index];
      if (!value || value.indexOf("=") < 1)
        throw new CliInputError("--arg requires key=value.");
      assignments.push(value);
    } else if (arg === "--args-file") {
      const value = args[++index];
      if (!value || (value.startsWith("-") && value !== "-"))
        throw new CliInputError("--args-file requires a path or - for stdin.");
      if (argsFile !== undefined)
        throw new CliInputError("Specify --args-file once.");
      argsFile = value;
    } else if (arg === "--stdin") {
      if (stdin) throw new CliInputError("Specify --stdin once.");
      stdin = true;
    } else if (arg === "--clients" || arg === "-c") {
      connection.push(arg, args[++index] ?? "");
    } else if (arg.startsWith("-")) connection.push(arg);
    else positional.push(arg);
  }
  if (!stdio && positional.length > 0) connection.push(positional[0]);
  let server: DiscoveryOptions;
  try {
    server = parseDiscoveryOptions(connection);
  } catch (error) {
    throw new CliInputError((error as Error).message);
  }
  const component = positional[stdio ? 0 : 1] ?? "";
  if (!server.help && (positional.length !== (stdio ? 1 : 2) || !component))
    throw new CliInputError(
      `Usage: ${command} <target> <${command === "read-resource" ? "uri" : "name"}> [options], or ${command} <name/uri> [options] --stdio <cmd> [args].`
    );
  if (
    Number(assignments.length > 0) +
      Number(argsFile !== undefined) +
      Number(stdin) >
    1
  )
    throw new CliInputError("Use only one of --arg, --args-file, or --stdin.");
  if (
    command === "read-resource" &&
    (assignments.length || argsFile !== undefined || stdin)
  )
    throw new CliInputError(
      "read-resource takes a complete URI, without argument options."
    );
  return {
    ...server,
    command,
    component,
    arguments: assignments,
    argsFile,
    stdin,
  };
}
