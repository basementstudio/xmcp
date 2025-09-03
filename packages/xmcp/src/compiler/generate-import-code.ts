import { compilerContext } from "./compiler-context";

export function generateImportCode(): string {
  const { toolPaths, promptPaths, hasMiddleware } =
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

${importMiddlewareCode}
`;
}

export function generateToolsExportCode(): string {
  const { toolPaths } = compilerContext.getContext();

  const importStatements = Array.from(toolPaths)
    .map((p, index) => {
      const path = p.replace(/\\/g, "/");
      const relativePath = `../${path}`;
      return `import * as tool${index} from "${relativePath}";`;
    })
    .join("\n");

  const toolsArray = Array.from(toolPaths)
    .map((p, index) => {
      const path = p.replace(/\\/g, "/");
      const fileName = path.split("/").pop() || path;
      const defaultName = fileName.replace(/\.[^/.]+$/, "");

      return `{
        path: "${path}",
        name: "${defaultName}",
        module: tool${index}
      }`;
    })
    .join(",\n  ");

  return `${importStatements}

/** 
 * Runtime-accessible tools function that works from any context.
 * Generated at build time - always up to date with discovered tools.
 */
export async function loadAllTools() {
  const toolsData = [
    ${toolsArray}
  ];

  const processedTools = [];

  for (const toolData of toolsData) {
    const { path, name: defaultName, module } = toolData;
    const { default: handler, metadata, schema } = module;

    const toolConfig = {
      name: defaultName,
      description: "No description provided",
      ...((typeof metadata === "object" && metadata !== null) ? metadata : {})
    };

    // Determine the actual schema to use
    let toolSchema = {};
    if (schema && typeof schema === "object" && schema !== null) {
      // Basic validation for Zod schema object
      const isValidSchema = Object.entries(schema).every(([key, val]) => {
        if (typeof key !== "string") return false;
        if (typeof val !== "object" || val === null) return false;
        if (!("parse" in val) || typeof val.parse !== "function") return false;
        return true;
      });
      
      if (isValidSchema) {
        toolSchema = schema;
      } else {
        console.warn(\`Invalid schema for tool "\${toolConfig.name}" at \${path}. Expected Record<string, z.ZodType>\`);
      }
    }

    // Make sure tools has annotations with a title
    if (toolConfig.annotations === undefined) {
      toolConfig.annotations = {};
    }
    if (toolConfig.annotations.title === undefined) {
      toolConfig.annotations.title = toolConfig.name;
    }

    processedTools.push({
      path,
      name: toolConfig.name,
      metadata: toolConfig,
      schema: toolSchema,
      handler: handler
    });
  }

  return processedTools;
}`;
}
