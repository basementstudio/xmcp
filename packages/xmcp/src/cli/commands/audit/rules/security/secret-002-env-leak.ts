import fs from "node:fs";
import path from "node:path";
import type { Finding, Rule } from "../../types";

const ID = "XMCP-SECRET-002";

const rule: Rule = {
  meta: {
    id: ID,
    name: "env-file-not-gitignored",
    description: ".env files in the project root must be listed in .gitignore",
    severity: "high",
    concern: "security",
    rationale:
      ".env files typically contain every secret the server needs. Without " +
      "a .gitignore entry, `git add -A` commits them. One forgotten `.env` " +
      "pushed to a public repo is enough to rotate every credential.",
    examples: {
      bad: ".env exists, .gitignore does not list it",
      good: ".gitignore contains `.env` (or `*.env`)",
    },
  },
  check(ctx): Finding[] {
    const envPath = path.join(ctx.projectRoot, ".env");
    if (!fs.existsSync(envPath)) return [];
    const gitignore = ctx.gitignoreContent ?? "";
    if (isIgnored(gitignore)) return [];
    const gitignorePath = path.join(ctx.projectRoot, ".gitignore");
    return [
      {
        ruleId: ID,
        severity: "high",
        concern: "security",
        message: ".env exists but is not in .gitignore",
        file: ctx.gitignoreContent !== null ? gitignorePath : envPath,
        line: 1,
        column: 1,
        suggestion:
          "Add `.env` to .gitignore and rotate any already-committed secrets",
      },
    ];
  },
};

function isIgnored(gitignore: string): boolean {
  for (const raw of gitignore.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    if (line === ".env" || line === "*.env" || line === ".env*") return true;
  }
  return false;
}

export default rule;
