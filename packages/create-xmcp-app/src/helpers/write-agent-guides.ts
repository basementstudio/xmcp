import path from "path";
import fs from "fs-extra";
import { fileURLToPath } from "url";

const REACT_TEMPLATE = "mcp-apps";
const SECTION_SEPARATOR = "\n";

const guidesDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../templates/agent-guides"
);

function readGuide(file: string): string {
  return fs.readFileSync(path.join(guidesDir, file), "utf8");
}

function agentsGuide(template: string): string {
  const sections = [readGuide("AGENTS.md")];
  if (template === REACT_TEMPLATE) {
    sections.push(readGuide("react-widgets.md"));
  }
  return sections.join(SECTION_SEPARATOR);
}

export function writeAgentGuides(projectPath: string, template: string): void {
  fs.writeFileSync(path.join(projectPath, "AGENTS.md"), agentsGuide(template));
  fs.writeFileSync(path.join(projectPath, "CLAUDE.md"), readGuide("CLAUDE.md"));
}
