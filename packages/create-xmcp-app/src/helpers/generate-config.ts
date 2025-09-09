import path from "path";
import fs from "fs-extra";

/**
 * Generate xmcp.config.ts based on selected transports and paths
 * @param projectPath - Project directory path
 * @param transports - Array of selected transport types
 * @param pathsConfig - Configuration for tools and prompts paths
 */
export function generateConfig(
  projectPath: string,
  transports: string[],
  pathsConfig?: { tools?: string; prompts?: string }
): void {
  const hasHttp = transports.includes("http");
  const hasStdio = transports.includes("stdio");

  let configContent = `import { type XmcpConfig } from "xmcp";

const config: XmcpConfig = {`;

  if (hasHttp) {
    configContent += `
  http: true,`;
  }

  if (hasStdio) {
    configContent += `
  stdio: true,`;
  }

  // Add paths configuration if any paths are defined
  if (pathsConfig && (pathsConfig.tools || pathsConfig.prompts)) {
    configContent += `
  paths: {`;

    if (pathsConfig.tools) {
      configContent += `
    tools: "${pathsConfig.tools}",`;
    }

    if (pathsConfig.prompts) {
      configContent += `
    prompts: "${pathsConfig.prompts}",`;
    }

    configContent += `
  },`;
  }

  configContent += `
};

export default config;
`;

  const configPath = path.join(projectPath, "xmcp.config.ts");
  fs.writeFileSync(configPath, configContent);
}
