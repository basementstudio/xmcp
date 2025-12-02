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

const DEFAULT_OUTPUT = "src/generated/tools.ts";
const DEFAULT_CLIENTS_FILE = "src/clients.ts";

export async function runGenerate(options: GenerateOptions = {}) {
  const loadedClients = await loadClientDefinitions(
    options.clientsFile,
    DEFAULT_CLIENTS_FILE
  );
  const clientDefinitions = loadedClients?.definitions ?? [];
  const targets = resolveTargets(options.url, clientDefinitions);

  logDetectedClients(loadedClients, clientDefinitions);

  const {
    resolvedOut,
    outIsFile,
    outputDir,
    multiFileBaseName,
    fileExtension,
  } = resolveOutputPaths(options.out ?? DEFAULT_OUTPUT);

  const generatedFiles: GeneratedFileInfo[] = [];

  for (const target of targets) {
    const client = await createHTTPClient({
      url: target.url,
      headers: target.headers,
    });
    const { tools } = await client.listTools();
    const exportName = `client${pascalCase(target.name)}`;

    const outputPath =
      targets.length === 1 && outIsFile
        ? resolvedOut
        : path.join(
            outputDir,
            `${outIsFile ? `${multiFileBaseName}.` : ""}${toFileSafeName(target.name)}${
              outIsFile ? path.extname(resolvedOut) : fileExtension
            }`
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

  if (generatedFiles.length > 1) {
    writeGeneratedClientsIndex(
      generatedFiles,
      path.join(outputDir, `${multiFileBaseName}.index.ts`)
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
  resolvedOut: string;
  outIsFile: boolean;
  outputDir: string;
  multiFileBaseName: string;
  fileExtension: string;
};

function resolveOutputPaths(out: string): OutputPaths {
  const resolvedOut = path.resolve(process.cwd(), out);
  const outExt = path.extname(resolvedOut);
  const outIsFile = outExt === ".ts";
  const outputDir = outIsFile ? path.dirname(resolvedOut) : resolvedOut;
  const baseFileName = outIsFile
    ? path.basename(resolvedOut, outExt)
    : "client";
  const multiFileBaseName = outIsFile ? "client" : baseFileName;

  return {
    resolvedOut,
    outIsFile,
    outputDir,
    multiFileBaseName,
    fileExtension: ".ts",
  };
}
