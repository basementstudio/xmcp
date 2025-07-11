import { compilerContext } from "./compiler-context";

export function generateImportCode(): string {
  const { toolPaths, hasMiddleware } = compilerContext.getContext();

  const importToolsCode = Array.from(toolPaths)
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

${importMiddlewareCode}
`;
}
