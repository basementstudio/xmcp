import {
  parseDiscoveryOptions,
  type DiscoveryOptions,
} from "./discovery-options.js";

export type InstallClient = "claude-desktop" | "cursor";
export interface InstallOptions extends DiscoveryOptions {
  client?: InstallClient;
  config?: string;
  name?: string;
  dryRun: boolean;
  replace: boolean;
}

export function parseInstallOptions(args: string[]): InstallOptions {
  const connection: string[] = [];
  const options: Pick<
    InstallOptions,
    "client" | "config" | "name" | "dryRun" | "replace"
  > = { dryRun: false, replace: false };
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === "--stdio") {
      connection.push(...args.slice(index));
      break;
    }
    if (arg === "--dry-run") options.dryRun = true;
    else if (arg === "--replace") options.replace = true;
    else if (arg === "--client" || arg === "--config" || arg === "--name") {
      const value = args[++index];
      if (!value?.trim() || value.startsWith("-"))
        throw new Error(`${arg} requires a value.`);
      if (arg === "--client") {
        if (value !== "claude-desktop" && value !== "cursor")
          throw new Error("--client must be claude-desktop or cursor.");
        options.client = value;
      } else if (arg === "--config") options.config = value;
      else options.name = value;
    } else {
      connection.push(arg);
      if (arg === "--clients" || arg === "-c")
        connection.push(args[++index] ?? "");
    }
  }
  return { ...parseDiscoveryOptions(connection), ...options };
}
