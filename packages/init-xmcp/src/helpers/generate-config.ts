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
  promptsPath?: string,
  resourcesPath?: string
): void {
  let configContent = `import { type XmcpConfig } from "xmcp";

const config: XmcpConfig = {
  http: true,
  experimental: {
    adapter: "${frameworkAdapter}",
  },`;

  if (toolsPath || promptsPath || resourcesPath) {
    configContent += `
  paths: {`;

    if (toolsPath) {
      configContent += `
    tools: "${toolsPath}",`;
    }

    if (promptsPath) {
      configContent += `
    prompts: "${promptsPath}",`;
    }

    if (resourcesPath) {
      configContent += `
    resources: "${resourcesPath}",`;
    }
    configContent += `
  },`;
  }

  if (frameworkAdapter === "nextjs") {
    configContent += `
  typescript: {
    skipTypeCheck: true,
  },`;
  }

  configContent += `
};

export default config;`;

  const configPath = path.join(projectPath, "xmcp.config.ts");
  fs.writeFileSync(configPath, configContent);
}
