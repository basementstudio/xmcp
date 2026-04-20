import type { Finding, Rule } from "../../types";

const ID = "XMCP-PERF-003";

const SOFT_CAP = 50;

const rule: Rule = {
  meta: {
    id: ID,
    name: "tool-sprawl",
    description: "Projects with over 50 tools see degraded LLM tool selection",
    severity: "info",
    concern: "performance",
    rationale:
      "Model tool-use accuracy drops as the tool surface grows. Past ~30 " +
      "tools the choice distribution flattens. Past 50 it's noticeably " +
      "unreliable. Group related tools into a single multi-modal tool or " +
      "split the server.",
    examples: {
      bad: "60 files under src/tools/",
      good:
        "<= 30 tools, or grouped into logical sub-servers via xmcp's " +
        "paths.tools config",
    },
  },
  check(ctx): Finding[] {
    if (ctx.tools.length <= SOFT_CAP) return [];
    return [
      {
        ruleId: ID,
        severity: "info",
        concern: "performance",
        message: `Project registers ${ctx.tools.length} tools (soft cap ${SOFT_CAP})`,
        file: ctx.toolsDir ?? ctx.projectRoot,
        suggestion: "Group related tools or split into multiple MCP servers",
      },
    ];
  },
};

export default rule;
