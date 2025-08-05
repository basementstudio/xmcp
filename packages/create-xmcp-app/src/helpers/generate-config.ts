import path from "path";
import fs from "fs-extra";

/**
 * Generate xmcp.config.ts based on selected transports
 * @param projectPath - Project directory path
 * @param transports - Array of selected transport types
 */
export function generateConfig(
  projectPath: string,
  transports: string[]
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

  configContent += `
};

export default config;
`;

  const configPath = path.join(projectPath, "xmcp.config.ts");
  fs.writeFileSync(configPath, configContent);
}
