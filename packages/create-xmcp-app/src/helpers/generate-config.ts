import path from "path";
import fs from "fs-extra";

/**
 * Generate xmcp.config.ts based on selected transports and paths
 * @param projectPath - Project directory path
 * @param transports - Array of selected transport types
 * @param paths - Array of selected paths (tools, prompts)
 */
export function generateConfig(
  projectPath: string,
  transports: string[],
  paths: string[] = ["tools", "prompts", "resources"]
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

  // Add paths configuration
  configContent += `
  paths: {`;

  // Add tools path (set to false if not selected)
  if (paths.includes("tools")) {
    configContent += `
    tools: "./src/tools",`;
  } else {
    configContent += `
    tools: false,`;
  }

  // Add prompts path (set to false if not selected)
  if (paths.includes("prompts")) {
    configContent += `
    prompts: "./src/prompts",`;
  } else {
    configContent += `
    prompts: false,`;
  }

  // Add resources path (set to false if not selected)
  if (paths.includes("resources")) {
    configContent += `
    resources: "./src/resources",`;
  } else {
    configContent += `
    resources: false,`;
  }

  // Close the paths object
  configContent += `
  },`;

  // Remove trailing comma if present
  configContent = configContent.endsWith(",")
    ? configContent.slice(0, -1)
    : configContent;

  configContent += `
};

export default config;
`;

  const configPath = path.join(projectPath, "xmcp.config.ts");
  fs.writeFileSync(configPath, configContent);
}
