import { readFile } from "node:fs/promises";
import {
  fromJsonSchema,
  type JsonSchemaType,
} from "@modelcontextprotocol/client";
import { CliInputError, type ExecutionOptions } from "./execution-options.js";

export function parseArgumentObject(json: string): Record<string, unknown> {
  let value: unknown;
  try {
    value = JSON.parse(json);
  } catch {
    throw new CliInputError("Arguments must be valid JSON.");
  }
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new CliInputError("Arguments must be a JSON object.");
  return value as Record<string, unknown>;
}

export function parseAssignments(
  assignments: string[],
  prompt: boolean
): Record<string, unknown> {
  const entries = new Map<string, unknown>();
  for (const assignment of assignments) {
    const separator = assignment.indexOf("=");
    if (separator < 1) throw new CliInputError("--arg requires key=value.");
    const name = assignment.slice(0, separator);
    if (entries.has(name))
      throw new CliInputError(`Duplicate argument "${name}".`);
    const raw = assignment.slice(separator + 1);
    let value: unknown = raw;
    if (!prompt) {
      try {
        value = JSON.parse(raw);
      } catch {
        /* Unquoted CLI values are strings. */
      }
    }
    entries.set(name, value);
  }
  return Object.fromEntries(entries);
}

export async function readExecutionArguments(
  options: ExecutionOptions
): Promise<Record<string, unknown>> {
  if (options.command === "read-resource") return {};
  if (options.arguments.length)
    return parseAssignments(
      options.arguments,
      options.command === "get-prompt"
    );
  if (options.argsFile && options.argsFile !== "-") {
    let contents: string;
    try {
      contents = await readFile(options.argsFile, "utf8");
    } catch (error) {
      throw new CliInputError(
        `Cannot read argument file: ${(error as Error).message}`
      );
    }
    return parseArgumentObject(contents);
  }
  const explicitStdin = options.stdin || options.argsFile === "-";
  if (process.stdin.isTTY) {
    if (explicitStdin) throw new CliInputError("Pipe a JSON object to stdin.");
    return {};
  }
  let contents = "";
  process.stdin.setEncoding("utf8");
  for await (const chunk of process.stdin) contents += chunk.toString();
  return !contents.trim() && !explicitStdin
    ? {}
    : parseArgumentObject(contents);
}

export async function validateToolArguments(
  schema: Record<string, unknown>,
  args: Record<string, unknown>
): Promise<void> {
  // The generator's JSON-schema converter emits source code. Use the SDK's
  // existing runtime validator here; never evaluate a server-supplied schema.
  // Tool definitions expose loose JSON values; schema compilation validates
  // their structure at this boundary and rejects an invalid server schema.
  const result = await fromJsonSchema(schema as JsonSchemaType)[
    "~standard"
  ].validate(args);
  if (result.issues)
    throw new CliInputError(
      `Invalid tool arguments: ${result.issues.map((issue) => issue.message).join("; ")}`
    );
}

export function validatePromptArguments(
  definitions: { name: string; required?: boolean }[],
  args: Record<string, unknown>
): Record<string, string> {
  for (const [name, value] of Object.entries(args)) {
    if (typeof value !== "string")
      throw new CliInputError(`Prompt argument "${name}" must be a string.`);
    if (!definitions.some((argument) => argument.name === name))
      throw new CliInputError(`Unknown prompt argument "${name}".`);
  }
  for (const argument of definitions)
    if (argument.required && !Object.hasOwn(args, argument.name))
      throw new CliInputError(`Missing prompt argument "${argument.name}".`);
  return args as Record<string, string>;
}
