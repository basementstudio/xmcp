import ts from "typescript";
import type { Finding, Rule } from "../../types";

import { getLineColumn } from "../../ast/parse";
import {
  findNamedExport,
  findObjectProperty,
  getStringLiteralValue,
} from "../../ast/visit";

const ID = "XMCP-MCP-001";

const SENSITIVE_VERBS =
  /\b(delete|remove|drop|destroy|truncate|overwrite|purge|wipe|erase|create|update|modify|write|send|post|charge|pay|transfer)\b/i;

const rule: Rule = {
  meta: {
    id: ID,
    name: "sensitive-tool-missing-auth-reference",
    description:
      "Destructive or state-changing tools should gate on extra.authInfo",
    severity: "medium",
    concern: "security",
    rationale:
      "Per-call authorization is the last line of defense — middleware " +
      "can be bypassed, but reading extra.authInfo inside the handler " +
      "proves the tool checked *this* request.",
    examples: {
      bad: "export default async ({ id }) => db.delete(id);",
      good:
        "export default async ({ id }, { authInfo }) => {\n" +
        '  if (!authInfo?.scopes.includes("admin")) throw new Error("denied");\n' +
        "  return db.delete(id);\n" +
        "};",
    },
    heuristic: true,
  },
  check(ctx): Finding[] {
    const findings: Finding[] = [];
    for (const file of ctx.tools) {
      const meta = findNamedExport(file.sourceFile, "metadata");
      if (!meta || !ts.isObjectLiteralExpression(meta)) continue;
      const nameProp = findObjectProperty(meta, "name");
      const descProp = findObjectProperty(meta, "description");
      const name = nameProp
        ? (getStringLiteralValue(nameProp.initializer) ?? "")
        : "";
      const description = descProp
        ? (getStringLiteralValue(descProp.initializer) ?? "")
        : "";
      const sensitive =
        SENSITIVE_VERBS.test(name) || SENSITIVE_VERBS.test(description);
      if (!sensitive) continue;
      if (/\bauthInfo\b/.test(file.source)) continue;
      findings.push({
        ruleId: ID,
        severity: "medium",
        concern: "security",
        message:
          "Sensitive tool does not reference extra.authInfo — no per-call auth check",
        file: file.absolutePath,
        line: 1,
        column: 1,
        suggestion:
          "Read authInfo from the second handler arg and validate scopes",
      });
    }
    return findings;
  },
};

export default rule;
