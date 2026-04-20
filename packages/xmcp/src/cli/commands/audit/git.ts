import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

// Git subprocess ceiling: keep bounded so `xmcp audit --since` never hangs
// a CI job on a broken repo. 30s is well above any realistic `git diff`.
const GIT_SUBPROCESS_TIMEOUT_MS = 30_000;

export interface ChangedFilesOptions {
  projectRoot: string;
  since?: string;
  changed?: boolean;
}

export function listChangedFiles(
  options: ChangedFilesOptions
): Set<string> | null {
  if (!isGitRepo(options.projectRoot)) return null;
  const names = new Set<string>();

  if (options.since !== undefined) {
    const diff = runGit(
      ["diff", "--name-only", options.since, "HEAD"],
      options.projectRoot
    );
    for (const name of splitNames(diff)) names.add(name);
  }

  if (options.changed) {
    const staged = runGit(
      ["diff", "--name-only", "--cached"],
      options.projectRoot
    );
    const unstaged = runGit(["diff", "--name-only"], options.projectRoot);
    for (const name of splitNames(staged)) names.add(name);
    for (const name of splitNames(unstaged)) names.add(name);
  }

  const untracked = runGit(
    ["ls-files", "--others", "--exclude-standard"],
    options.projectRoot
  );
  for (const name of splitNames(untracked)) names.add(name);

  const absolute = new Set<string>();
  for (const name of names) {
    absolute.add(path.resolve(options.projectRoot, name));
  }
  return absolute;
}

function isGitRepo(projectRoot: string): boolean {
  let current = projectRoot;
  while (true) {
    if (fs.existsSync(path.join(current, ".git"))) return true;
    const parent = path.dirname(current);
    if (parent === current) return false;
    current = parent;
  }
}

function runGit(args: string[], cwd: string): string {
  try {
    return execFileSync("git", args, {
      cwd,
      encoding: "utf8",
      timeout: GIT_SUBPROCESS_TIMEOUT_MS,
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    return "";
  }
}

function splitNames(output: string): string[] {
  return output
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}
