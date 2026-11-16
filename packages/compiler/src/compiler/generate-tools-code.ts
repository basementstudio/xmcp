import { compilerContext } from "./compiler-context";

// this is an experimental feature
// currently it's only used for the nextjs adapter & is manually generated to resolve the async imports
// this prevents the tools from being an async function that needs to resolve first, instead it just returns the array

export function generateToolsExportCode(): string {
  const { toolPaths, xmcpConfig } = compilerContext.getContext();

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

  const inferSchemas = !!xmcpConfig?.experimental?.inferToolSchemas;
  return `import { z } from "zod";
${inferSchemas ? 'import { withInferredSchema } from "./inferred-tools.js";' : ""}

${importStatements}

// A schema is either a complete zod schema or a { field: zodSchema } map
const isCompleteSchema = (value) =>
  typeof value === "object" && value !== null && typeof value["~standard"] === "object";
const isFieldMap = (value) =>
  typeof value === "object" && value !== null &&
  Object.entries(value).every(([key, val]) =>
    typeof key === "string" && typeof val === "object" && val !== null &&
    "parse" in val && typeof val.parse === "function"
  );

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
    const { default: handler, metadata, schema, outputSchema } = ${inferSchemas ? "withInferredSchema(module, path)" : "module"};

    const toolConfig = {
      name: defaultName,
      description: "No description provided",
      ...((typeof metadata === "object" && metadata !== null) ? metadata : {})
    };

    let inputSchema = z.object({});
    if (isCompleteSchema(schema)) {
      inputSchema = schema;
    } else if (isFieldMap(schema)) {
      inputSchema = z.object(schema);
    } else if (schema !== undefined && schema !== null) {
      console.warn(\`Invalid schema for tool "\${toolConfig.name}" at \${path}. Expected a zod schema or Record<string, z.ZodType>\`);
    }

    let toolOutputSchema = undefined;
    if (isCompleteSchema(outputSchema)) {
      toolOutputSchema = outputSchema;
    } else if (isFieldMap(outputSchema)) {
      toolOutputSchema = z.object(outputSchema).strict();
    } else if (outputSchema !== undefined && outputSchema !== null) {
      throw new Error(\`Invalid outputSchema for tool "\${toolConfig.name}" at \${path}. Expected a zod schema or Record<string, z.ZodType>\`);
    }

    // Make sure tools has annotations with a title — shallow copy to avoid mutating shared objects
    toolConfig.annotations = { ...(toolConfig.annotations ?? {}) };
    if (toolConfig.annotations.title === undefined) {
      toolConfig.annotations.title = toolConfig.name;
    }

    // Add to registry in the formatted structure
    registry[toolConfig.name] = {
      description: toolConfig.description,
      inputSchema,
      outputSchema: toolOutputSchema,
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
  inputSchema: z.ZodTypeAny;
  outputSchema?: z.ZodTypeAny;
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
