import { compilerContext } from "./compiler-context";

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

  return `import { z } from "zod";

${importStatements}

/** 
 * Runtime-accessible tools function that works from any context.
 * Generated at build time - always up to date with discovered tools.
 */
export async function tools() {
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
}

/**
 * Tool registry for AI SDK integration
 * Provides a typed registry of all tools for use with AI frameworks
 */
export async function toolRegistry() {
  const toolsList = await tools();
  const registry = Object.fromEntries(
    toolsList.map((toolItem) => [
      toolItem.metadata.name,
      {
        description: toolItem.metadata.description,
        inputSchema: z.object(toolItem.schema || {}),
        execute: async (args) => {
          const result = await toolItem.handler(args);
          return result;
        },
      },
    ])
  );

  return registry;
}`;
}

export function generateToolsTypesCode(): string {
  const { toolPaths } = compilerContext.getContext();

  const toolNames = Array.from(toolPaths).map((p) => {
    const path = p.replace(/\\/g, "/");
    const fileName = path.split("/").pop() || path;
    return fileName.replace(/\.[^/.]+$/, "");
  });

  const toolNamesUnion =
    toolNames.length > 0
      ? toolNames.map((name) => `"${name}"`).join(" | ")
      : "never";

  return `import { z } from "zod";

export interface ToolMetadata {
  name: string;
  description: string;
  annotations?: {
    title?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface ToolItem {
  path: string;
  name: string;
  metadata: ToolMetadata;
  schema: Record<string, z.ZodType>;
  handler: (args: any) => Promise<any>;
}

export interface ToolRegistryItem {
  description: string;
  inputSchema: z.ZodObject<any>;
  execute: (args: any) => Promise<any>;
}

export type ToolRegistry = Record<string, ToolRegistryItem>;

export type ToolNames = ${toolNamesUnion};

declare global {
  namespace XMCP {
    interface Tools extends ToolRegistry {}
  }
}

export declare function tools(): Promise<ToolItem[]>;
export declare function toolRegistry(): Promise<ToolRegistry>;
`;
}
