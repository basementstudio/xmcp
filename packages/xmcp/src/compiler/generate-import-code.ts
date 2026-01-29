import { compilerContext } from "./compiler-context";

/**
 * Generate a valid identifier from a file path for use in variable names.
 * Converts paths like "src/tools/hello.ts" to "src_tools_hello_ts"
 */
function pathToIdentifier(path: string): string {
  return path.replace(/[^a-zA-Z0-9]/g, "_");
}

export function generateImportCode(): string {
  const {
    toolPaths,
    promptPaths,
    resourcePaths,
    hasMiddleware,
    clientBundles,
  } = compilerContext.getContext();

  // Use static imports across platforms.
  // This keeps the bundling model consistent (no code-splitting).
  return generateStaticImportCode(
    toolPaths,
    promptPaths,
    resourcePaths,
    hasMiddleware,
    clientBundles
  );
}

/**
 * Generate static imports for Cloudflare Workers.
 * This ensures all code is bundled into a single file without code splitting.
 */
function generateStaticImportCode(
  toolPaths: Set<string>,
  promptPaths: Set<string>,
  resourcePaths: Set<string>,
  hasMiddleware: boolean,
  clientBundles?: Map<string, string>
): string {
  // Generate static import statements at the top
  const staticImports: string[] = [];
  const toolsEntries: string[] = [];
  const promptsEntries: string[] = [];
  const resourcesEntries: string[] = [];

  Array.from(toolPaths).forEach((p) => {
    const path = p.replace(/\\/g, "/");
    const relativePath = `../${path}`;
    const identifier = pathToIdentifier(path);
    staticImports.push(`import * as ${identifier} from "${relativePath}";`);
    toolsEntries.push(`"${path}": () => Promise.resolve(${identifier}),`);
  });

  Array.from(promptPaths).forEach((p) => {
    const path = p.replace(/\\/g, "/");
    const relativePath = `../${path}`;
    const identifier = pathToIdentifier(path);
    staticImports.push(`import * as ${identifier} from "${relativePath}";`);
    promptsEntries.push(`"${path}": () => Promise.resolve(${identifier}),`);
  });

  Array.from(resourcePaths).forEach((p) => {
    const path = p.replace(/\\/g, "/");
    const relativePath = `../${path}`;
    const identifier = pathToIdentifier(path);
    staticImports.push(`import * as ${identifier} from "${relativePath}";`);
    resourcesEntries.push(`"${path}": () => Promise.resolve(${identifier}),`);
  });

  let middlewareCode = "";
  if (hasMiddleware) {
    staticImports.push(`import * as _middleware from "../src/middleware.ts";`);
    middlewareCode = `export const middleware = () => Promise.resolve(_middleware);`;
  }

  // Generate client bundles mapping (empty object if none)
  const clientBundlesEntries =
    clientBundles && clientBundles.size > 0
      ? Array.from(clientBundles)
          .map(([toolName, bundlePath]) => `  "${toolName}": "${bundlePath}",`)
          .join("\n")
      : "";

  return `${staticImports.join("\n")}

export const tools = {
${toolsEntries.join("\n")}
};

export const prompts = {
${promptsEntries.join("\n")}
};

export const resources = {
${resourcesEntries.join("\n")}
};

export const clientBundles = {
${clientBundlesEntries}
};

${middlewareCode}
`;
}
