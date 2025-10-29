import { compilerContext } from "./compiler-context";

export function generateImportCode(): string {
  const { toolPaths, promptPaths, resourcePaths, hasMiddleware } =
    compilerContext.getContext();

  const importToolsCode = Array.from(toolPaths)
    .map((p) => {
      const path = p.replace(/\\/g, "/");
      const relativePath = `../${path}`;
      return `"${path}": () => import("${relativePath}"),`;
    })
    .join("\n");

  const importPromptsCode = Array.from(promptPaths)
    .map((p) => {
      const path = p.replace(/\\/g, "/");
      const relativePath = `../${path}`;
      return `"${path}": () => import("${relativePath}"),`;
    })
    .join("\n");

  const importResourcesCode = Array.from(resourcePaths)
    .map((p) => {
      const path = p.replace(/\\/g, "/");
      const relativePath = `../${path}`;
      return `"${path}": () => import("${relativePath}"),`;
    })
    .join("\n");

  const importMiddlewareCode = hasMiddleware
    ? `export const middleware = () => import("../src/middleware");`
    : "";

  return `
export const tools = {
${importToolsCode}
};

export const prompts = {
${importPromptsCode}
};

export const resources = {
${importResourcesCode}
};

${importMiddlewareCode}
`;
}

/**
 * Generate client bundles mapping for React
 */
export function generateClientBundlesCode(
  bundleMap: Map<string, string>
): string {
  if (bundleMap.size === 0) {
    return `\nexport const clientBundles = {};\n`;
  }

  const bundleEntries = Array.from(bundleMap)
    .map(([toolName, bundlePath]) => {
      return `  "${toolName}": "${bundlePath}",`;
    })
    .join("\n");

  return `
export const clientBundles = {
${bundleEntries}
};
`;
}
