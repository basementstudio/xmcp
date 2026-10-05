import {
  assertFetchRouteAvailable,
  createFetchRoute,
  getFetchRoute,
  isFetchFramework,
} from "./create-fetch-route.js";
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
import { createNestJsModule } from "./create-nestjs-module.js";

import {
  assertTanstackRouteAvailable,
  createTanstackRoute,
  getTanstackRoute,
} from "./create-tanstack-route.js";

interface InitOptions {
  cloudflare?: boolean;
  projectRoot: string;
  framework: Framework;
  toolsPath: string | undefined;
  promptsPath: string | undefined;
  resourcesPath: string | undefined;
  routePath: string | undefined;
  packageManager: "npm" | "yarn" | "pnpm" | "bun";
  version: string;
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
    version,
    cloudflare,
  } = options;

  if (framework === "tanstack" && routePath) {
    assertTanstackRouteAvailable(projectRoot, routePath);
  }
  const hasFetchRoute = framework === "hono" || framework === "sveltekit";
  if (hasFetchRoute && routePath) {
    assertFetchRouteAvailable(projectRoot, framework, routePath);
  }
  const endpoint =
    framework === "tanstack" && routePath
      ? getTanstackRoute(projectRoot, routePath).endpoint
      : hasFetchRoute && routePath
        ? getFetchRoute(projectRoot, framework, routePath).endpoint
        : undefined;
  generateConfig(
    projectRoot,
    framework,
    toolsPath,
    promptsPath,
    resourcesPath,
    endpoint
  );

  await install(projectRoot, packageManager, version);

  updatePackageJson(projectRoot, { framework, cloudflare });

  // Fetch routes use relative imports. Preserve host-generated paths and includes.
  if (!isFetchFramework(framework)) updateTsConfig(projectRoot);

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

  if (framework === "tanstack" && routePath) {
    createTanstackRoute(projectRoot, routePath);
  }

  if (hasFetchRoute && routePath) {
    createFetchRoute(projectRoot, framework, routePath);
  }

  if (framework === "nestjs") {
    createNestJsModule(projectRoot);
  }
}
