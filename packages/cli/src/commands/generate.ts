import fs from "node:fs";
import path from "node:path";
import pkg, { CustomHeaders } from "xmcp";
const { createHTTPClient, createSTDIOClient, disconnectSTDIOClient } = pkg;
import {
  loadClientDefinitions,
  type ClientDefinition,
  type LoadedClients,
} from "../utils/client-definitions.js";
import { pascalCase, toFileSafeName } from "../utils/naming.js";
import {
  buildClientFileContents,
  writeGeneratedClientsIndex,
  type GeneratedFileInfo,
} from "../utils/templates.js";

export interface GenerateOptions {
  url?: string;
  out?: string;
  clientsFile?: string;
}

const DEFAULT_OUTPUT = "src/generated";
const DEFAULT_CLIENTS_FILE = "src/clients.ts";

export async function runGenerate(options: GenerateOptions = {}) {
  const loadedClients = await loadClientDefinitions(
    options.clientsFile,
    DEFAULT_CLIENTS_FILE
  );
  const clientDefinitions = loadedClients?.definitions ?? [];
  const targets = resolveTargets(options.url, clientDefinitions);

  logDetectedClients(loadedClients, clientDefinitions);

  const { outputDir } = resolveOutputPaths(options.out ?? DEFAULT_OUTPUT);

  const generatedFiles: GeneratedFileInfo[] = [];

  for (const target of targets) {
    const tools = await fetchToolsForTarget(target);
    const exportName = `client${pascalCase(target.name)}`;

    const outputPath = path.join(
      outputDir,
      `client.${toFileSafeName(target.name)}.ts`
    );

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    const fileContents = buildClientFileContents({
      tools,
      exportName,
      transport:
        target.type === "http"
          ? {
              type: "http" as const,
              url: target.url,
              headers: target.headers,
            }
          : {
              type: "stdio" as const,
              command: target.command,
              args: target.args,
              npm: target.npm,
              npmArgs: target.npmArgs,
              env: target.env,
              cwd: target.cwd,
              stderr: target.stderr,
            },
    });
    fs.writeFileSync(outputPath, fileContents);

    generatedFiles.push({
      clientName: target.name,
      exportName,
      outputPath,
    });

    console.log(
      `Generated ${tools.length} tool${
        tools.length === 1 ? "" : "s"
      } for "${target.name}" (${target.type}) -> ${path.relative(
        process.cwd(),
        outputPath
      )}`
    );
  }

  if (generatedFiles.length > 0) {
    writeGeneratedClientsIndex(
      generatedFiles,
      path.join(outputDir, "client.index.ts")
    );
  }
}

function resolveTargets(
  explicitUrl: string | undefined,
  clientDefinitions: ClientDefinition[]
): ClientDefinition[] {
  if (explicitUrl || process.env.MCP_URL) {
    const resolvedUrl = explicitUrl ?? process.env.MCP_URL!;
    return [
      {
        type: "http",
        name: clientDefinitions[0]?.name ?? "client",
        url: resolvedUrl,
        headers:
          clientDefinitions[0]?.type === "http"
            ? clientDefinitions[0].headers
            : undefined,
      },
    ];
  }

  if (clientDefinitions.length === 0) {
    throw new Error(
      "Unable to determine MCP URL. Provide --url, set MCP_URL, or add entries to clients.ts."
    );
  }

  return clientDefinitions;
}

function logDetectedClients(
  loadedClients: LoadedClients | undefined,
  clientDefinitions: ClientDefinition[]
) {
  if (!loadedClients || clientDefinitions.length === 0) {
    return;
  }

  console.log(
    `Detected ${clientDefinitions.length} client${
      clientDefinitions.length === 1 ? "" : "s"
    } from ${path.relative(process.cwd(), loadedClients.sourcePath)}`
  );
}

type OutputPaths = {
  outputDir: string;
};

function resolveOutputPaths(out: string): OutputPaths {
  const resolvedOut = path.resolve(process.cwd(), out);
  const isFileTarget = path.extname(resolvedOut) === ".ts";
  const outputDir = isFileTarget ? path.dirname(resolvedOut) : resolvedOut;

  return {
    outputDir,
  };
}

async function fetchToolsForTarget(target: ClientDefinition) {
  if (target.type === "http") {
    const client = await createHTTPClient({
      url: target.url,
      headers: target.headers,
    });
    const { tools } = await client.listTools();
    return tools;
  }

  const connection = await createSTDIOClient({
    command: target.command,
    args: target.args,
    env: target.env,
    cwd: target.cwd,
    stderr: target.stderr,
  });

  try {
    const { tools } = await connection.client.listTools();
    return tools;
  } finally {
    await disconnectSTDIOClient(connection);
  }
}
