import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, expect, test } from "vitest";

import { getProjectId, getRawProjectId } from "@/telemetry/project-id";

// `getRawProjectId()` reads `package.json` from `process.cwd()`, so the
// tests cd into a tempdir for each case and restore cwd in afterEach.

let originalCwd: string;
let tempDir: string;

beforeEach(async () => {
  originalCwd = process.cwd();
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "xmcp-project-id-"));
  process.chdir(tempDir);
});

afterEach(async () => {
  process.chdir(originalCwd);
  await fs.rm(tempDir, { recursive: true, force: true });
});

test("getRawProjectId formats package.json as `name@version`", async () => {
  await fs.writeFile(
    path.join(tempDir, "package.json"),
    JSON.stringify({ name: "my-app", version: "1.2.3" }),
    "utf8"
  );
  expect(await getRawProjectId()).toBe("my-app@1.2.3");
});

test("getRawProjectId substitutes defaults for missing name/version", async () => {
  await fs.writeFile(path.join(tempDir, "package.json"), "{}", "utf8");
  expect(await getRawProjectId()).toBe("unknown@0.0.0");
});

test("getRawProjectId falls back to cwd when package.json is missing", async () => {
  // `tempDir` is the cwd but contains no package.json.
  // macOS resolves /var/folders to /private/var/folders for cwd.
  expect(await getRawProjectId()).toBe(process.cwd());
});

test("getRawProjectId falls back to cwd on malformed JSON", async () => {
  await fs.writeFile(
    path.join(tempDir, "package.json"),
    "{ not valid json",
    "utf8"
  );
  expect(await getRawProjectId()).toBe(process.cwd());
});

test("getProjectId hashes the raw id via the supplied hasher", async () => {
  await fs.writeFile(
    path.join(tempDir, "package.json"),
    JSON.stringify({ name: "x", version: "1.0.0" }),
    "utf8"
  );
  const seen: string[] = [];
  const hashed = await getProjectId((payload) => {
    seen.push(payload);
    return `H(${payload})`;
  });
  expect(seen).toEqual(["x@1.0.0"]);
  expect(hashed).toBe("H(x@1.0.0)");
});
