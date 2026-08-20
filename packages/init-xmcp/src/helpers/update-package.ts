import path from "path";
import fs from "fs-extra";

/**
 * update package.json scripts to include xmcp build and dev commands
 * @param projectPath - The root directory of the project
 * @returns void
 */
export function updatePackageJson(projectPath: string): void {
  const packageJsonPath = path.join(projectPath, "package.json");
  const packageJson = fs.readJsonSync(packageJsonPath);

  if (!packageJson.scripts) {
    packageJson.scripts = {};
  }

  packageJson.devDependencies = packageJson.devDependencies ?? {};
  packageJson.devDependencies["@xmcp-dev/compiler"] ??= "latest";

  // prepend commands to existing scripts - prevent overwriting
  if (packageJson.scripts.build) {
    packageJson.scripts.build = `xmcp build && ${packageJson.scripts.build}`;
  } else {
    packageJson.scripts.build = "xmcp build";
  }

  if (packageJson.scripts.dev) {
    packageJson.scripts.dev = `xmcp dev & ${packageJson.scripts.dev}`;
  } else {
    packageJson.scripts.dev = "xmcp dev";
  }

  fs.writeJsonSync(packageJsonPath, packageJson, { spaces: 2 });
}
