#!/usr/bin/env node
import { createRequire } from "module";
import path from "path";
import { runUpgrade, UPGRADE_COMMANDS } from "./cli/upgrade";

// Upgrades start from projects without @xmcp-dev/compiler (0.x), so they are
// handled here instead of in the compiler CLI.
if (UPGRADE_COMMANDS.includes(process.argv[2])) {
  process.exit(runUpgrade(process.argv.slice(3)));
}

const projectRequire = createRequire(path.join(process.cwd(), "package.json"));

let compilerCliPath: string;
try {
  compilerCliPath = projectRequire.resolve("@xmcp-dev/compiler/cli");
} catch {
  console.error(
    "xmcp dev/build now requires the dev-only compiler: npm i -D @xmcp-dev/compiler\n" +
      "Upgrading from xmcp 0.x? Run: npx xmcp@latest upgrade"
  );
  process.exit(1);
}

projectRequire(compilerCliPath);
