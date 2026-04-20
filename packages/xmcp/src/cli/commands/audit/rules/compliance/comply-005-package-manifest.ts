import type { Finding, Rule } from "../../types";

const ID = "XMCP-COMPLY-005";

const rule: Rule = {
  meta: {
    id: ID,
    name: "package-manifest-missing-fields",
    description:
      "package.json must have a name and version to publish an MCP server",
    severity: "low",
    concern: "compliance",
    rationale:
      "MCP server manifests require `name` and `version` for registry " +
      "publication and for clients to identify the server.",
    examples: {
      bad: '{ "scripts": { "dev": "xmcp dev" } }',
      good: '{ "name": "my-server", "version": "0.1.0" }',
    },
  },
  check(ctx): Finding[] {
    if (!ctx.packageJson || !ctx.packageJsonPath) return [];
    const missing: string[] = [];
    if (!ctx.packageJson.name || typeof ctx.packageJson.name !== "string") {
      missing.push("name");
    }
    if (
      !ctx.packageJson.version ||
      typeof ctx.packageJson.version !== "string"
    ) {
      missing.push("version");
    }
    if (missing.length === 0) return [];
    return [
      {
        ruleId: ID,
        severity: "low",
        concern: "compliance",
        message: `package.json is missing: ${missing.join(", ")}`,
        file: ctx.packageJsonPath,
        line: 1,
        column: 1,
        suggestion: "Add the required fields to package.json",
      },
    ];
  },
};

export default rule;
