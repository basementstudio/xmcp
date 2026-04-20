import type { Finding, Rule } from "../../types";

const ID = "XMCP-COMPLY-002";

const rule: Rule = {
  meta: {
    id: ID,
    name: "resource-missing-mime-type",
    description: "Resource handlers should return a mimeType field",
    severity: "medium",
    concern: "compliance",
    rationale:
      "The MCP spec requires resource contents to declare `mimeType` so " +
      "clients can render them correctly (text vs. image vs. binary). " +
      "Omitting it forces clients into fallback behavior.",
    examples: {
      bad: 'return { uri: "file:///x", text: "hello" };',
      good: 'return { uri: "file:///x", mimeType: "text/plain", text: "hello" };',
    },
  },
  check(ctx): Finding[] {
    const findings: Finding[] = [];
    for (const file of ctx.resources) {
      // Heuristic source scan: resource files that never mention mimeType
      // almost certainly don't set it. AST-deep analysis of every return path
      // is out of scope for MVP — this false-negatives on clever dynamic
      // construction, but false-positives are minimal.
      if (/\bmimeType\b/.test(file.source)) continue;
      findings.push({
        ruleId: ID,
        severity: "medium",
        concern: "compliance",
        message: "Resource handler never references mimeType",
        file: file.absolutePath,
        line: 1,
        column: 1,
        suggestion: "Include `mimeType` in the returned resource contents",
      });
    }
    return findings;
  },
};

export default rule;
