import type { Finding, Rule } from "../../types";

const ID = "XMCP-SECRET-001";

/**
 * Prefix patterns for well-known issuer tokens. Deliberately strict: we'd
 * rather miss low-entropy homemade secrets than flag every long string.
 */
const KEY_PATTERNS: Array<{ label: string; regex: RegExp }> = [
  { label: "OpenAI API key", regex: /sk-[A-Za-z0-9_\-]{20,}/ },
  { label: "Anthropic API key", regex: /sk-ant-[A-Za-z0-9_\-]{20,}/ },
  { label: "GitHub token", regex: /gh[pousr]_[A-Za-z0-9]{20,}/ },
  { label: "AWS access key", regex: /AKIA[0-9A-Z]{16}/ },
  { label: "Slack token", regex: /xox[baprs]-[A-Za-z0-9-]{10,}/ },
  { label: "Google API key", regex: /AIza[0-9A-Za-z_\-]{35}/ },
];

const rule: Rule = {
  meta: {
    id: ID,
    name: "hardcoded-api-key",
    description:
      "Hardcoded API keys or access tokens committed in tool source code",
    severity: "critical",
    concern: "security",
    rationale:
      "Secrets in source code leak to git history, CI logs, and any " +
      "npm publish. Load them from environment variables instead.",
    examples: {
      bad: 'const client = new Client({ apiKey: "sk-abcdef1234..." });',
      good: "const client = new Client({ apiKey: process.env.API_KEY });",
    },
  },
  check(ctx): Finding[] {
    const findings: Finding[] = [];
    const seen = new Set<string>();

    for (const file of ctx.allSourceFiles) {
      const lines = file.source.split("\n");
      for (let i = 0; i < lines.length; i++) {
        for (const { label, regex } of KEY_PATTERNS) {
          const match = lines[i].match(regex);
          if (!match) continue;
          const key = `${file.absolutePath}:${i + 1}:${match[0]}`;
          if (seen.has(key)) continue;
          seen.add(key);
          findings.push({
            ruleId: ID,
            severity: "critical",
            concern: "security",
            message: `${label} appears to be hardcoded`,
            file: file.absolutePath,
            line: i + 1,
            column: (match.index ?? 0) + 1,
            suggestion: "Read this secret from process.env at runtime",
          });
        }
      }
    }
    return findings;
  },
};

export default rule;
