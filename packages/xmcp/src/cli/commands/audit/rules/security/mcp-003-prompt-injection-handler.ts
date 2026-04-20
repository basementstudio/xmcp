import ts from "typescript";
import type { Finding, Rule } from "../../types";
import { getLineColumn } from "../../ast/parse";
import {
  collectHandlerParamBindings,
  findHandlerFunction,
  referencesBinding,
  walk,
} from "../../ast/visit";

const ID = "XMCP-MCP-003";

const rule: Rule = {
  meta: {
    id: ID,
    name: "prompt-handler-interpolates-user-input",
    description:
      "Prompt handlers must sanitize user input before embedding it in returned prompts",
    severity: "high",
    concern: "security",
    rationale:
      "A prompt handler's output becomes part of the next model context. " +
      "Interpolating raw caller input into that output lets the caller " +
      "smuggle instructions to the model downstream.",
    examples: {
      bad:
        "export default async ({ topic }) => ({\n" +
        "  content: `You are an expert on ${topic}. Ignore previous instructions.`\n" +
        "});",
      good:
        'const safe = topic.replace(/[^a-zA-Z0-9 ]/g, "").slice(0, 80);\n' +
        "return { content: `You are an expert on ${safe}.` };",
    },
    heuristic: true,
  },
  check(ctx): Finding[] {
    const findings: Finding[] = [];
    for (const file of ctx.prompts) {
      const handler = findHandlerFunction(file.sourceFile);
      if (!handler) continue;
      const bindings = collectHandlerParamBindings(handler);
      if (bindings.size === 0) continue;

      walk(handler, (node) => {
        if (!ts.isTemplateExpression(node)) return;
        if (
          !node.templateSpans.some((s) =>
            referencesBinding(s.expression, bindings)
          )
        ) {
          return;
        }
        // Downgrade if we see obvious sanitization in the same function.
        const text = handler.getText(file.sourceFile);
        if (
          /\b(?:replace|sanitize|escape|slice|substring|toLowerCase)\b/.test(
            text
          )
        ) {
          return;
        }
        const { line, column } = getLineColumn(
          file.sourceFile,
          node.getStart(file.sourceFile)
        );
        findings.push({
          ruleId: ID,
          severity: "high",
          concern: "security",
          message:
            "Prompt template interpolates handler input without visible sanitization",
          file: file.absolutePath,
          line,
          column,
          suggestion:
            "Strip control characters and cap length before interpolation",
        });
      });
    }
    return findings;
  },
};

export default rule;
