import fs from "node:fs";
import path from "node:path";
import type { HttpClient, CustomHeaders } from "xmcp";
import { toIdentifier, pascalCase } from "./naming.js";
import { jsonSchemaToZodObjectCode } from "./json-schema-to-zod.js";

export type ToolListResult = Awaited<ReturnType<HttpClient["listTools"]>>;
export type ToolDefinition = ToolListResult["tools"][number];

export type GeneratedFileInfo = {
  clientName: string;
  exportName: string;
  outputPath: string;
};

type HttpTransportTemplate = {
  type: "http";
  url: string;
  headers?: CustomHeaders;
};

type StdioTransportTemplate = {
  type: "stdio";
  command: string;
  args: string[];
  npm?: string;
  npmArgs?: string[];
  env?: Record<string, string>;
  cwd?: string;
  stderr?: "pipe" | "inherit" | "ignore";
};

export type BuildClientOptions = {
  tools: ToolDefinition[];
  exportName: string;
  transport: HttpTransportTemplate | StdioTransportTemplate;
};

export function buildClientFileContents({
  tools,
  exportName,
  transport,
}: BuildClientOptions): string {
  const clientTypeName =
    transport.type === "http" ? "HttpClient" : "StdioClient";
  const { schemasAndHandlers, registryEntries } = buildSchemaSections(
    tools,
    clientTypeName
  );

  if (transport.type === "http") {
    return buildHttpTemplate({
      exportName,
      schemasAndHandlers,
      registryEntries,
      url: transport.url,
      headers: transport.headers,
    });
  }

  return buildStdioTemplate({
    exportName,
    schemasAndHandlers,
    registryEntries,
    transport,
  });
}

type SchemaSection = {
  schemasAndHandlers: string;
  registryEntries: string;
};

function buildSchemaSections(
  tools: ToolDefinition[],
  clientTypeName: string
): SchemaSection {
  const schemaBlocks = tools.map((tool) => {
    const identifier = toIdentifier(tool.name);
    const schemaExportId = `${identifier}Schema`;
    const argsType = `${pascalCase(tool.name)}Args`;

    const inputSchema = (tool.inputSchema ?? {
      type: "object",
      properties: {},
    }) as Record<string, unknown>;
    const zodSchemaCode = jsonSchemaToZodObjectCode(inputSchema);

    const requiresArgs =
      tool.inputSchema &&
      typeof tool.inputSchema === "object" &&
      "required" in tool.inputSchema &&
      Array.isArray((tool.inputSchema as Record<string, unknown>).required) &&
      ((tool.inputSchema as Record<string, unknown>).required as unknown[])
        .length > 0;

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
      block: `export const ${schemaExportId} = ${zodSchemaCode};
export type ${argsType} = z.infer<typeof ${schemaExportId}>;

export const ${identifier}Metadata: ToolMetadata = ${JSON.stringify(
        metadata,
        null,
        2
      )};

async function ${identifier}(client: ${clientTypeName}${
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

  return {
    schemasAndHandlers: schemaBlocks.map((block) => block.block).join("\n"),
    registryEntries: schemaBlocks
      .map(({ identifier, argsType, requiresArgs }) => {
        const signature = requiresArgs
          ? `(args: ${argsType}) => ${identifier}(client, args)`
          : `() => ${identifier}(client)`;
        return `    ${identifier}: async ${signature},`;
      })
      .join("\n"),
  };
}

type HttpTemplateOptions = {
  exportName: string;
  schemasAndHandlers: string;
  registryEntries: string;
  url: string;
  headers?: CustomHeaders;
};

function buildHttpTemplate({
  exportName,
  schemasAndHandlers,
  registryEntries,
  url,
  headers,
}: HttpTemplateOptions): string {
  const headersLiteral =
    headers && headers.length > 0
      ? JSON.stringify(headers, null, 2)
      : undefined;

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
  const optionLines = [
    "url?: string;",
    headersLiteral ? "headers?: CustomHeaders;" : undefined,
  ].filter(Boolean);
  const optionsInterface = optionLines.length
    ? `export interface RemoteToolClientOptions {\n  ${optionLines.join(
        "\n  "
      )}\n}`
    : `export interface RemoteToolClientOptions {}`;

  return `/* auto-generated - do not edit */
import { z } from "zod";
import { createHTTPClient, type HttpClient, type ToolMetadata${headersImport} } from "xmcp";

const DEFAULT_REMOTE_URL = ${JSON.stringify(url)};
${headersConstant}
${schemasAndHandlers}

${optionsInterface}

export async function createRemoteToolClient(
  options: RemoteToolClientOptions = {}
) {
  const client = await createHTTPClient({
    url: options.url ?? DEFAULT_REMOTE_URL,${
      headersLiteral ? "\n    headers: options.headers ?? DEFAULT_HEADERS," : ""
    }
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

type StdioTemplateOptions = {
  exportName: string;
  schemasAndHandlers: string;
  registryEntries: string;
  transport: StdioTransportTemplate;
};

function buildStdioTemplate({
  exportName,
  schemasAndHandlers,
  registryEntries,
  transport,
}: StdioTemplateOptions): string {
  const hasNpmPackage = typeof transport.npm === "string";
  const commandLiteral = JSON.stringify(transport.command);
  const npmLiteral = hasNpmPackage ? JSON.stringify(transport.npm) : undefined;
  const argsLiteral = JSON.stringify(
    hasNpmPackage ? (transport.npmArgs ?? []) : transport.args
  );
  const envLiteral = transport.env
    ? JSON.stringify(transport.env, null, 2)
    : undefined;
  const cwdLiteral = transport.cwd ? JSON.stringify(transport.cwd) : undefined;
  const stderrLiteral = JSON.stringify(transport.stderr ?? "pipe");

  const commandConstant = `\nconst DEFAULT_STDIO_COMMAND = ${commandLiteral};\n`;
  const npmConstant = hasNpmPackage
    ? `\nconst DEFAULT_NPM_PACKAGE = ${npmLiteral};\n`
    : "";
  const argsConstName = hasNpmPackage
    ? "DEFAULT_NPM_ARGS"
    : "DEFAULT_STDIO_ARGS";
  const argsConstant = `\nconst ${argsConstName}: string[] = ${argsLiteral};\n`;
  const envConstant = envLiteral
    ? `\nconst DEFAULT_STDIO_ENV: Record<string, string> = ${envLiteral};\n`
    : "";
  const cwdConstant = cwdLiteral
    ? `\nconst DEFAULT_STDIO_CWD = ${cwdLiteral};\n`
    : "";
  const stderrConstant = `\nconst DEFAULT_STDIO_STDERR = ${stderrLiteral} as const;\n`;

  const optionLines = [
    "command?: string;",
    hasNpmPackage ? "npm?: string;" : undefined,
    "args?: string[];",
    "env?: Record<string, string>;",
    "cwd?: string;",
    'stderr?: "pipe" | "inherit" | "ignore";',
  ].filter(Boolean);

  const optionsInterface = `export interface RemoteToolClientOptions {
  ${optionLines.join("\n  ")}
}`;

  const argsResolution = hasNpmPackage
    ? `  const npmPackage = options.npm ?? DEFAULT_NPM_PACKAGE;
  const extraArgs = options.args ?? ${argsConstName};`
    : `  const resolvedArgs = options.args ?? ${argsConstName};`;

  const envResolution = `  const env = ${
    envLiteral ? "options.env ?? DEFAULT_STDIO_ENV" : "options.env"
  };`;
  const cwdResolution = `  const cwd = ${
    cwdLiteral ? "options.cwd ?? DEFAULT_STDIO_CWD" : "options.cwd"
  };`;

  const argsExpression = hasNpmPackage
    ? "[npmPackage, ...extraArgs]"
    : "resolvedArgs";

  return `/* auto-generated - do not edit */
import { z } from "zod";
import { createSTDIOClient, type StdioClient, type ToolMetadata } from "xmcp";

${commandConstant}${npmConstant}${argsConstant}${envConstant}${cwdConstant}${stderrConstant}
${schemasAndHandlers}

${optionsInterface}

export async function createRemoteToolClient(
  options: RemoteToolClientOptions = {}
) {
  const command = options.command ?? DEFAULT_STDIO_COMMAND;
${argsResolution}
${envResolution}
${cwdResolution}
  const stderr = options.stderr ?? DEFAULT_STDIO_STDERR;

  const connection = await createSTDIOClient({
    command,
    args: ${argsExpression},
    env,
    cwd,
    stderr,
  });
  const client = connection.client;

  return {
${registryEntries}
    rawClient: client,
    connection,
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
