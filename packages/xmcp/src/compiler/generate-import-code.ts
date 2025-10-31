import { compilerContext } from "./compiler-context";

export function generateImportCode(): string {
  const {
    toolPaths,
    promptPaths,
    resourcePaths,
    hasMiddleware,
    clientBundles,
  } = compilerContext.getContext();

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

  // Generate client bundles mapping (empty object if none)
  const clientBundlesEntries =
    clientBundles && clientBundles.size > 0
      ? Array.from(clientBundles)
          .map(([toolName, bundlePath]) => `  "${toolName}": "${bundlePath}",`)
          .join("\n")
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

export const clientBundles = {
${clientBundlesEntries}
};

${importMiddlewareCode}
`;
}
