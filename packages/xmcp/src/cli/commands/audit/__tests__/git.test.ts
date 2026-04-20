import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { listChangedFiles } from "../git";

function mkRepo(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "xmcp-audit-git-"));
  execFileSync("git", ["init", "-q", "-b", "main"], { cwd: dir });
  execFileSync("git", ["config", "user.email", "t@test.local"], { cwd: dir });
  execFileSync("git", ["config", "user.name", "t"], { cwd: dir });
  return dir;
}

function commit(
  dir: string,
  file: string,
  contents: string,
  msg: string
): void {
  fs.writeFileSync(path.join(dir, file), contents);
  execFileSync("git", ["add", "-A"], { cwd: dir });
  execFileSync("git", ["commit", "-q", "-m", msg], { cwd: dir });
}

describe("audit git integration", () => {
  it("returns null when not a git repo", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "xmcp-audit-nogit-"));
    const result = listChangedFiles({ projectRoot: dir, since: "HEAD~1" });
    assert.equal(result, null);
  });

  it("detects files changed since a past ref", () => {
    const dir = mkRepo();
    commit(dir, "a.ts", "export const a = 1;\n", "initial");
    commit(dir, "b.ts", "export const b = 2;\n", "second");
    fs.writeFileSync(path.join(dir, "a.ts"), "export const a = 42;\n");
    execFileSync("git", ["commit", "-q", "-am", "mutate a"], { cwd: dir });

    const changed = listChangedFiles({ projectRoot: dir, since: "HEAD~1" });
    assert.ok(changed);
    assert.ok(changed.has(path.resolve(dir, "a.ts")), "a.ts should be flagged");
    assert.ok(!changed.has(path.resolve(dir, "b.ts")), "b.ts should not");
  });

  it("--changed picks up untracked files", () => {
    const dir = mkRepo();
    commit(dir, "a.ts", "export const a = 1;\n", "initial");
    fs.writeFileSync(path.join(dir, "new.ts"), "export const n = 1;\n");

    const changed = listChangedFiles({ projectRoot: dir, changed: true });
    assert.ok(changed);
    assert.ok(changed.has(path.resolve(dir, "new.ts")));
  });
});
