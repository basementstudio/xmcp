import path from "path";
import fs from "fs-extra";

/**
 * Generate xmcp.config.ts based on selected framework adapter
 * @param projectPath - Project directory path
 * @param frameworkAdapter - Selected framework adapter
 * @param toolsPath - Optional path for tools directory
 */
export function generateConfig(
  projectPath: string,
  frameworkAdapter: string,
  toolsPath?: string,
  promptsPath?: string
): void {
  let configContent = `import { type XmcpConfig } from "xmcp";

const config: XmcpConfig = {
  http: true,
  experimental: {
    adapter: "${frameworkAdapter}",
  },`;

  if (toolsPath) {
    configContent += `
  paths: {
    tools: "${toolsPath}",
  },`;
  }
  if (promptsPath) {
    configContent += `
  paths: {
    prompts: "${promptsPath}",
  },`;
  }

  if (toolsPath && promptsPath) {
    configContent += `
  paths: {
    tools: "${toolsPath}",
    prompts: "${promptsPath}",
  },`;
  }

  configContent += `
};

export default config;`;

  const configPath = path.join(projectPath, "xmcp.config.ts");
  fs.writeFileSync(configPath, configContent);
}
