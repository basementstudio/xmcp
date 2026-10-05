import { isFetchFramework } from "./create-fetch-route.js";
import path from "path";
import fs from "fs-extra";
import type { Framework } from "./detect-framework.js";

/**
 * update package.json scripts to include xmcp build and dev commands
 * @param projectPath - The root directory of the project
 * @returns void
 */
export function updatePackageJson(
  projectPath: string,
  options: { framework?: Framework; cloudflare?: boolean } = {}
): void {
  const packageJsonPath = path.join(projectPath, "package.json");
  const packageJson = fs.readJsonSync(packageJsonPath);

  if (!packageJson.scripts) {
    packageJson.scripts = {};
  }

  packageJson.devDependencies = packageJson.devDependencies ?? {};
  packageJson.devDependencies["@xmcp-dev/compiler"] ??= "latest";

  const fetchFramework = isFetchFramework(options.framework);
  const viteFramework =
    options.framework === "tanstack" || options.framework === "sveltekit";
  const platformFlag = fetchFramework && options.cloudflare ? " --cf" : "";
  const build = `xmcp build${platformFlag}`;
  const dev = `xmcp dev${platformFlag}`;

  // prepend commands to existing scripts - prevent overwriting
  if (packageJson.scripts.build) {
    packageJson.scripts.build = `${build} && ${packageJson.scripts.build}`;
  } else {
    packageJson.scripts.build = viteFramework
      ? `${build} && vite build`
      : build;
  }

  if (packageJson.scripts.dev) {
    packageJson.scripts.dev = fetchFramework
      ? `${build} && (${dev} & ${packageJson.scripts.dev})`
      : `${dev} & ${packageJson.scripts.dev}`;
  } else {
    packageJson.scripts.dev = fetchFramework
      ? viteFramework
        ? `${build} && (${dev} & vite dev)`
        : `${build} && ${dev}`
      : dev;
  }

  fs.writeJsonSync(packageJsonPath, packageJson, { spaces: 2 });
}
