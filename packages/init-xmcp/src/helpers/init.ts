import { generateConfig } from "./generate-config.js";
import { install } from "./install.js";
import { updatePackageJson } from "./update-package.js";
import { updateTsConfig } from "./update-tsconfig.js";
import { updateGitignore } from "./update-gitignore.js";
import { createTool } from "./create-tool.js";
import { Framework } from "./detect-framework.js";
import { createRoute } from "./create-handler.js";
import { createPrompt } from "./create-prompt.js";
import { createResources } from "./create-resources.js";

interface InitOptions {
  projectRoot: string;
  framework: Framework;
  toolsPath: string | undefined;
  promptsPath: string | undefined;
  resourcesPath: string | undefined;
  routePath: string | undefined;
  packageManager: "npm" | "yarn" | "pnpm" | "bun";
}

export async function init(options: InitOptions) {
  const {
    projectRoot,
    framework,
    toolsPath,
    promptsPath,
    resourcesPath,
    routePath,
    packageManager,
  } = options;

  generateConfig(projectRoot, framework, toolsPath, promptsPath, resourcesPath);

  await install(projectRoot, packageManager);

  updatePackageJson(projectRoot);

  updateTsConfig(projectRoot);

  updateGitignore(projectRoot);

  if (toolsPath) {
    createTool(projectRoot, toolsPath);
  }

  if (promptsPath) {
    createPrompt(projectRoot, promptsPath);
  }

  if (resourcesPath) {
    createResources(projectRoot, resourcesPath);
  }

  if (framework === "nextjs" && routePath) {
    createRoute(projectRoot, routePath);
  }
}
