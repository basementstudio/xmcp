import type { ResolvedToolEntry } from "./tool-discovery";

// this is an experimental feature
// currently it's only used for the nextjs adapter & is manually generated to resolve the async imports
// this prevents the tools from being an async function that needs to resolve first, instead it just returns the array

export function generateToolsExportCode(toolEntries: ResolvedToolEntry[]): string {
  const importStatements = toolEntries
    .map(({ path }, index) => {
      const normalizedPath = path.replace(/\\/g, "/");
      const relativePath = `../${normalizedPath}`;
      return `import * as tool${index} from "${relativePath}";`;
    })
    .join("\n");

  const toolsArray = toolEntries
    .map(({ path, canonicalName }, index) => {
      const normalizedPath = path.replace(/\\/g, "/");
      return `{
          path: "${normalizedPath}",
          name: "${canonicalName}",
          module: tool${index}
        }`;
    })
    .join(",\n  ");

  return `import { z } from "zod";

${importStatements}

/**
 * Runtime-accessible tools function that works from any context.
 * Generated at build time - always up to date with discovered tools.
 * @returns {Promise<ToolRegistry>}
 */
export async function getTools() {
  const toolsData = [
    ${toolsArray}
  ];

  const registry = {};

  for (const toolData of toolsData) {
    const { path, name: defaultName, module } = toolData;
    const { default: handler, metadata, schema, outputSchema } = module;

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

    let toolOutputSchema = undefined;
    if (outputSchema && typeof outputSchema === "object" && outputSchema !== null) {
      const isValidOutputSchema = Object.entries(outputSchema).every(([key, val]) => {
        if (typeof key !== "string") return false;
        if (typeof val !== "object" || val === null) return false;
        if (!("parse" in val) || typeof val.parse !== "function") return false;
        return true;
      });

      if (isValidOutputSchema) {
        toolOutputSchema = outputSchema;
      } else {
        throw new Error(\`Invalid outputSchema for tool "\${toolConfig.name}" at \${path}. Expected Record<string, z.ZodType>\`);
      }
    }

    // Make sure tools has annotations with a title — shallow copy to avoid mutating shared objects
    toolConfig.annotations = { ...(toolConfig.annotations ?? {}) };
    if (toolConfig.annotations.title === undefined) {
      toolConfig.annotations.title = toolConfig.name;
    }

    // Add to registry in the formatted structure
    registry[toolConfig.name] = {
      description: toolConfig.description,
      inputSchema: z.object(toolSchema || {}),
      outputSchema: toolOutputSchema
        ? z.object(toolOutputSchema).strict()
        : undefined,
      execute: async (args, extra) => {
        const result = await handler(args, extra);
        return result;
      },
    };
  }

  return registry;
}

export const tools = await getTools();`;
}

export function generateToolsTypesCode(toolEntries: ResolvedToolEntry[]): string {
  const toolNames = toolEntries.map((entry) => entry.canonicalName);

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
  outputSchema?: z.ZodObject<any>;
  execute: (args: any) => Promise<any>;
}

export type ToolNames = ${toolNamesUnion};

export type ToolRegistry = {
  [k in ToolNames]: ToolRegistryItem;
};

declare global {
  namespace XMCP {
    interface Tools extends ToolRegistry {}
  }
}

export declare function getTools(): Promise<ToolRegistry>;
export declare const tools: ToolRegistry;
`;
}
