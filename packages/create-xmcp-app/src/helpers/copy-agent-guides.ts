import path from "path";
import fs from "fs-extra";
import { fileURLToPath } from "url";

const AGENT_GUIDE_FILES = ["AGENTS.md", "CLAUDE.md"];

const templatesDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../templates"
);

export function copyAgentGuides(projectPath: string): void {
  for (const file of AGENT_GUIDE_FILES) {
    fs.copySync(path.join(templatesDir, file), path.join(projectPath, file));
  }
}
