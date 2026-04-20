import ts from "typescript";
import type { Finding, Rule } from "../../types";
import { getLineColumn } from "../../ast/parse";
import {
  findNamedExport,
  findObjectProperty,
  getStringLiteralValue,
} from "../../ast/visit";

const ID = "XMCP-PERF-004";

const SIMILARITY_THRESHOLD = 0.85;

interface DescriptionEntry {
  text: string;
  file: string;
  line: number;
  column: number;
  toolName: string;
}

const rule: Rule = {
  meta: {
    id: ID,
    name: "duplicate-tool-descriptions",
    description:
      "Tool descriptions that are >=85% similar confuse LLM tool selection",
    severity: "low",
    concern: "performance",
    rationale:
      "The model picks tools by similarity of the request to each " +
      "description. Near-duplicates flatten the signal; selection becomes " +
      "essentially random between the colliding tools.",
    examples: {
      bad:
        '// tool A description: "Create a new user in the database"\n' +
        '// tool B description: "Create a new user in the db"',
      good:
        'A: "Create a new user in the customer DB"\n' +
        'B: "Create a new user in the internal admin DB"',
    },
  },
  check(ctx): Finding[] {
    const entries: DescriptionEntry[] = [];
    for (const file of ctx.tools) {
      const meta = findNamedExport(file.sourceFile, "metadata");
      if (!meta || !ts.isObjectLiteralExpression(meta)) continue;
      const descProp = findObjectProperty(meta, "description");
      if (!descProp) continue;
      const description = getStringLiteralValue(descProp.initializer);
      if (!description || description.trim().length === 0) continue;
      const nameProp = findObjectProperty(meta, "name");
      const toolName =
        (nameProp && getStringLiteralValue(nameProp.initializer)) ??
        file.absolutePath;
      const { line, column } = getLineColumn(
        file.sourceFile,
        descProp.getStart(file.sourceFile)
      );
      entries.push({
        text: description.trim(),
        file: file.absolutePath,
        line,
        column,
        toolName,
      });
    }

    const findings: Finding[] = [];
    const reported = new Set<string>();
    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        const ratio = similarityRatio(entries[i].text, entries[j].text);
        if (ratio < SIMILARITY_THRESHOLD) continue;
        for (const e of [entries[i], entries[j]]) {
          const key = `${e.file}:${e.line}`;
          if (reported.has(key)) continue;
          reported.add(key);
          findings.push({
            ruleId: ID,
            severity: "low",
            concern: "performance",
            message: `Tool description is ${(ratio * 100).toFixed(0)}% similar to "${entries[i === entries.indexOf(e) ? j : i].toolName}"`,
            file: e.file,
            line: e.line,
            column: e.column,
            suggestion: "Rewrite the descriptions to highlight what differs",
          });
        }
      }
    }
    return findings;
  },
};

function similarityRatio(a: string, b: string): number {
  if (a === b) return 1;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  const distance = levenshtein(a, b);
  return 1 - distance / maxLen;
}

function levenshtein(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const prev = new Array(b.length + 1);
  const curr = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j];
  }
  return prev[b.length];
}

export default rule;
