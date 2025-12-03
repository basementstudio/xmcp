import fs from "node:fs";
import path from "node:path";
import type { HttpClient, CustomHeaders } from "xmcp";
import { toIdentifier, pascalCase } from "./naming.js";

export type ToolListResult = Awaited<ReturnType<HttpClient["listTools"]>>;
export type ToolDefinition = ToolListResult["tools"][number];

export type GeneratedFileInfo = {
  clientName: string;
  exportName: string;
  outputPath: string;
};

export type BuildClientOptions = {
  tools: ToolDefinition[];
  clientUrlLiteral: string;
  exportName: string;
  headers?: CustomHeaders;
};

export function buildClientFileContents({
  tools,
  clientUrlLiteral,
  exportName,
  headers,
}: BuildClientOptions): string {
  const helperFunctions = `
function jsonSchemaToZodShape(schema: any): Record<string, z.ZodTypeAny> {
  if (!schema || typeof schema !== "object" || schema.type !== "object") {
    return {};
  }

  const properties = schema.properties ?? {};
  const required = new Set(
    Array.isArray(schema.required) ? (schema.required as string[]) : []
  );

  const shape: Record<string, z.ZodTypeAny> = {};

  for (const [key, propertySchema] of Object.entries(properties)) {
    shape[key] = jsonSchemaToZod(propertySchema, required.has(key));
  }

  return shape;
}

function jsonSchemaToZod(
  schema: any,
  isRequired: boolean
): z.ZodTypeAny {
  if (!schema || typeof schema !== "object") {
    return z.any();
  }

  let zodType: z.ZodTypeAny;

  if (Array.isArray(schema.enum) && schema.enum.length > 0) {
    const enumValues = schema.enum as [string, ...string[]];
    zodType = z.enum(enumValues);
  } else {
    switch (schema.type) {
      case "string":
        zodType = z.string();
        break;
      case "number":
      case "integer":
        zodType = z.number();
        break;
      case "boolean":
        zodType = z.boolean();
        break;
      case "array":
        zodType = z.array(jsonSchemaToZod(schema.items ?? {}, true));
        break;
      case "object":
        zodType = z.object(jsonSchemaToZodShape(schema));
        break;
      default:
        zodType = z.any();
    }
  }

  if (typeof schema.description === "string") {
    zodType = zodType.describe(schema.description);
  }

  if (!isRequired) {
    zodType = zodType.optional();
  }

  return zodType;
}

function jsonSchemaToZodObject(
  schema: any
): z.ZodObject<Record<string, z.ZodTypeAny>> {
  return z.object(jsonSchemaToZodShape(schema));
}
`;

  const schemaBlocks = tools.map((tool) => {
    const identifier = toIdentifier(tool.name);
    const schemaShapeId = `${identifier}Shape`;
    const schemaExportId = `${identifier}Schema`;
    const schemaObjectId = `${identifier}SchemaObject`;
    const argsType = `${pascalCase(tool.name)}Args`;
    const schemaLiteral = JSON.stringify(tool.inputSchema ?? {}, null, 2);
    const requiresArgs =
      tool.inputSchema &&
      typeof tool.inputSchema === "object" &&
      "required" in tool.inputSchema &&
      Array.isArray((tool.inputSchema as any).required) &&
      (tool.inputSchema as any).required.length > 0;

    const metadata = {
      name: tool.name,
      description: tool.description ?? "No description provided",
      ...(tool.annotations && Object.keys(tool.annotations).length > 0
        ? { annotations: tool.annotations }
        : {}),
      ...(tool._meta && Object.keys(tool._meta).length > 0
        ? { _meta: tool._meta }
        : {}),
    };

    return {
      identifier,
      argsType,
      requiresArgs,
      block: `const ${schemaShapeId}Json = ${schemaLiteral} as const;
export const ${schemaShapeId} = jsonSchemaToZodShape(${schemaShapeId}Json);
const ${schemaObjectId} = z.object(${schemaShapeId});
export const ${schemaExportId} = jsonSchemaToZodObject(${schemaShapeId}Json);
export type ${argsType} = z.infer<typeof ${schemaObjectId}>;

export const ${identifier}Metadata: ToolMetadata = ${JSON.stringify(
        metadata,
        null,
        2
      )};

async function ${identifier}(client: HttpClient${
        requiresArgs ? `, args: ${argsType}` : ""
      }) {
  return client.callTool({
    name: "${tool.name}",
    arguments: ${requiresArgs ? "args" : "{}"},
  });
}
`,
    };
  });

  const schemasAndHandlers = schemaBlocks
    .map((block) => block.block)
    .join("\n");

  const registryEntries = schemaBlocks
    .map(({ identifier, argsType, requiresArgs }) => {
      const signature = requiresArgs
        ? `(args: ${argsType}) => ${identifier}(client, args)`
        : `() => ${identifier}(client)`;
      return `    ${identifier}: async ${signature},`;
    })
    .join("\n");

  const headersLiteral =
    headers && headers.length > 0
      ? JSON.stringify(headers, null, 2)
      : undefined;

  // Warn if any headers contain literal values (potential secrets)
  if (headers && headers.length > 0) {
    const staticHeaders = headers.filter(
      (h) => "value" in h && h.value && !h.value.startsWith("$")
    );
    if (staticHeaders.length > 0) {
      console.warn(
        `Warning: Headers with static values detected. Consider using { env: "ENV_VAR_NAME" } for sensitive values like API keys.`
      );
    }
  }

  const headersConstant = headersLiteral
    ? `\nconst DEFAULT_HEADERS: CustomHeaders = ${headersLiteral};\n`
    : "";

  const headersImport = headersLiteral ? ", type CustomHeaders" : "";

  return `/* auto-generated - do not edit */
import { z } from "zod";
import { createHTTPClient, type HttpClient, type ToolMetadata${headersImport} } from "xmcp";

const DEFAULT_REMOTE_URL = ${clientUrlLiteral};
${headersConstant}
${helperFunctions}

${schemasAndHandlers}

export interface RemoteToolClientOptions {
  url?: string;${headersLiteral ? "\n  headers?: CustomHeaders;" : ""}
}

export async function createRemoteToolClient(
  options: RemoteToolClientOptions = {}
) {
  const client = await createHTTPClient({
    url: options.url ?? DEFAULT_REMOTE_URL,${headersLiteral ? "\n    headers: options.headers ?? DEFAULT_HEADERS," : ""}
  });

  return {
${registryEntries}
    rawClient: client,
  } as const;
}

export type RemoteToolClient = Awaited<
  ReturnType<typeof createRemoteToolClient>
>;

export const ${exportName} = createRemoteToolClient();
`;
}

export function writeGeneratedClientsIndex(
  files: GeneratedFileInfo[],
  indexPath: string
): void {
  const indexDir = path.dirname(indexPath);
  fs.mkdirSync(indexDir, { recursive: true });

  const imports = files
    .map(({ exportName, outputPath }) => {
      const relative = path
        .relative(indexDir, outputPath)
        .replace(/\\/g, "/")
        .replace(/\.ts$/, "");
      const importPath = relative.startsWith(".") ? relative : `./${relative}`;
      return `import { ${exportName}, type RemoteToolClient as ${pascalCase(exportName)}Client } from "${importPath}";`;
    })
    .join("\n");

  const mapEntries = files
    .map(
      ({ clientName, exportName }) =>
        `  ${JSON.stringify(clientName)}: proxyPromise<${pascalCase(exportName)}Client>(${exportName}),`
    )
    .join("\n");

  const proxyPromiseHelper = `/**
 * Wraps a promise-based client so you can call methods directly
 * without awaiting the client first.
 *
 * Usage:
 *   generatedClients.local.randomNumber()  // returns Promise, no need to await client first
 *   generatedClients.remote.greet({ name: "World" })
 */
function proxyPromise<T extends object>(clientPromise: Promise<T>): T {
  return new Proxy({} as T, {
    get(_target, prop) {
      return async (...args: unknown[]) => {
        const client = await clientPromise;
        const method = (client as Record<string | symbol, unknown>)[prop];
        if (typeof method === "function") {
          return method.call(client, ...args);
        }
        throw new Error(\`Property "\${String(prop)}" is not a function\`);
      };
    },
  });
}`;

  const content = `/* auto-generated - do not edit */
${imports}

${proxyPromiseHelper}

export const generatedClients = {
${mapEntries}
} as const;
`;

  fs.writeFileSync(indexPath, content);
  console.log(
    `Generated clients index -> ${path.relative(process.cwd(), indexPath)}`
  );
}
