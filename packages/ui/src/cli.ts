#!/usr/bin/env node
import { initUi } from "./scaffold.js";

function printUsage() {
  console.log(`Usage: xmcp-ui init [--force] [--dry-run]

Commands:
  init       Add @xmcp-dev/ui starter files to an existing xmcp project.

Options:
  --force    Replace starter files if they already exist.
  --dry-run  Print planned changes without writing files.
  --help     Show this help message.
`);
}

const args = process.argv.slice(2);
const command = args[0];
const flags = new Set(args.slice(1));

if (!command || command === "--help" || command === "-h") {
  printUsage();
  process.exit(0);
}

if (command !== "init") {
  console.error(`Unknown command: ${command}`);
  printUsage();
  process.exit(1);
}

try {
  const changed = initUi({
    force: flags.has("--force"),
    dryRun: flags.has("--dry-run"),
  });

  const prefix = flags.has("--dry-run") ? "Would update" : "Updated";
  for (const filePath of changed) {
    console.log(`${prefix} ${filePath}`);
  }

  if (!flags.has("--dry-run")) {
    console.log(
      "Run your package manager install command to install any new dependencies."
    );
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
