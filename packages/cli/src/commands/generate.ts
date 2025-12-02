import fs from "node:fs";
import path from "node:path";
import pkg, { CustomHeaders } from "xmcp";
const { createHTTPClient } = pkg;
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
    const client = await createHTTPClient({
      url: target.url,
      headers: target.headers,
    });
    const { tools } = await client.listTools();
    const exportName = `client${pascalCase(target.name)}`;

    const outputPath = path.join(
      outputDir,
      `client.${toFileSafeName(target.name)}.ts`
    );

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    const fileContents = buildClientFileContents(
      tools,
      JSON.stringify(target.url),
      exportName
    );
    fs.writeFileSync(outputPath, fileContents);

    generatedFiles.push({
      clientName: target.name,
      exportName,
      outputPath,
    });

    console.log(
      `Generated ${tools.length} tool${
        tools.length === 1 ? "" : "s"
      } for "${target.name}" client -> ${path.relative(
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
        name: clientDefinitions[0]?.name ?? "client",
        url: resolvedUrl,
        headers: clientDefinitions[0]?.headers ?? ([] as CustomHeaders),
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
