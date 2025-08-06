import path from "path";
import fs from "fs-extra";

/**
 * Update package.json with project-specific configuration
 * @param projectPath - Project directory path
 * @param projectName - Name of the project
 * @param transports - Array of selected transport types
 */
export function updatePackageJson(
  projectPath: string,
  projectName: string,
  transports: string[]
): void {
  const packageJsonPath = path.join(projectPath, "package.json");
  const packageJson = fs.readJsonSync(packageJsonPath);

  packageJson.name = projectName;

  // Add transport-specific scripts
  const hasHttp = transports.includes("http");
  const hasStdio = transports.includes("stdio");

  const hasBoth = hasHttp && hasStdio;

  // Add scripts based on selected transports
  if (hasHttp) {
    packageJson.scripts[hasBoth ? "start-http" : "start"] = "node dist/http.js";
  }

  if (hasStdio) {
    packageJson.scripts[hasBoth ? "start-stdio" : "start"] =
      "node dist/stdio.js";
  }

  // Add main and files fields for stdio transport
  if (hasStdio) {
    packageJson.main = "./dist/stdio.js";
    packageJson.files = ["dist"];
    packageJson.bin = {
      [projectName]: "./dist/stdio.js",
    };
  }

  packageJson.dependencies["xmcp"] = "latest";

  fs.writeJsonSync(packageJsonPath, packageJson, { spaces: 2 });
}
