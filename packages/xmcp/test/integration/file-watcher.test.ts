import { describe, it, expect, beforeAll, afterAll } from "vitest";
import path from "node:path";
import fs from "node:fs/promises";
import { spawnDevServer, type DevServerHandle } from "./_utils";

/**
 * Drives `xmcp dev` against an isolated copy of the basic-tools fixture and
 * pins the file-watcher contract:
 *  - Add a tool file → import-map regenerated to include it.
 *  - Modify a tool file → recompile fires.
 *  - Delete a tool file → import-map drops it (regression for PR #248).
 *  - Restart watch mode → state recovers from the on-disk truth (PR #40).
 *
 * Each step waits on a fresh "Compiled in" line on stdout — the rebuild marker
 * the compiler already prints — so no source change to compile() is needed.
 */
describe("xmcp dev — file watcher", () => {
  let server: DevServerHandle;
  let tempDir: string;
  let importMapPath: string;
  const ADDED_TOOL_REL = "src/tools/added.ts";

  const readImportMap = () => fs.readFile(importMapPath, "utf8");

  beforeAll(async () => {
    server = await spawnDevServer("basic-tools");
    tempDir = server.tempDir;
    importMapPath = path.join(tempDir, ".xmcp", "import-map.js");
  }, 60_000);

  afterAll(async () => {
    if (server) await server.stop();
    if (tempDir) await fs.rm(tempDir, { recursive: true, force: true });
  });

  it("emits an import-map referencing the seed tool after first build", async () => {
    const map = await readImportMap();
    expect(map).toContain('"src/tools/echo.ts"');
  });

  it("regenerates the import-map when a new tool file is added", async () => {
    const addedPath = path.join(tempDir, ADDED_TOOL_REL);
    const wait = server.waitForRebuild();
    await fs.writeFile(addedPath, ADDED_TOOL_SOURCE, "utf8");
    await wait;
    const map = await readImportMap();
    expect(map).toContain(`"${ADDED_TOOL_REL}"`);
    expect(map).toContain('"src/tools/echo.ts"');
  });

  it("recompiles when an existing tool file changes", async () => {
    const echoPath = path.join(tempDir, "src/tools/echo.ts");
    const wait = server.waitForRebuild();
    const original = await fs.readFile(echoPath, "utf8");
    await fs.writeFile(
      echoPath,
      original + "\n// touched by file-watcher test\n",
      "utf8"
    );
    await wait;
  });

  it("drops a deleted tool from the import-map (regression PR #248)", async () => {
    const addedPath = path.join(tempDir, ADDED_TOOL_REL);
    const wait = server.waitForRebuild();
    await fs.unlink(addedPath);
    await wait;
    const map = await readImportMap();
    expect(map).not.toContain(`"${ADDED_TOOL_REL}"`);
    expect(map).toContain('"src/tools/echo.ts"');
  });

  it("recovers state on restart — import-map matches the on-disk tools (regression PR #40)", async () => {
    await server.stop();
    server = await spawnDevServer("basic-tools", { tempDir });
    const map = await readImportMap();
    expect(map).toContain('"src/tools/echo.ts"');
    expect(map).not.toContain(`"${ADDED_TOOL_REL}"`);
  }, 90_000);
});

const ADDED_TOOL_SOURCE = `import { z } from "zod";
import { type InferSchema, type ToolMetadata } from "xmcp";

export const schema = {
  text: z.string().describe("Text to repeat back"),
};

export const metadata: ToolMetadata = {
  name: "added",
  description: "Tool added at runtime by the file-watcher test",
  annotations: {
    title: "Added",
    readOnlyHint: true,
    idempotentHint: true,
  },
};

export default function added({ text }: InferSchema<typeof schema>) {
  return \`added: \${text}\`;
}
`;
