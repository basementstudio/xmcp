#!/usr/bin/env node
import { createRequire } from "module";
import path from "path";

const projectRequire = createRequire(path.join(process.cwd(), "package.json"));

let compilerCliPath: string;
try {
  compilerCliPath = projectRequire.resolve("@xmcp-dev/compiler/cli");
} catch {
  console.error(
    "xmcp dev/build now requires the dev-only compiler: npm i -D @xmcp-dev/compiler"
  );
  process.exit(1);
}

projectRequire(compilerCliPath);
