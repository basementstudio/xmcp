import fs from "node:fs";
import path from "node:path";
import pkg from "xmcp";
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
  const targets = resolveTargets(clientDefinitions);

  logDetectedClients(loadedClients, clientDefinitions);

  const { outputDir } = resolveOutputPaths(options.out ?? DEFAULT_OUTPUT);

  const generatedFiles: GeneratedFileInfo[] = [];
  const failedClients: { name: string; type: string; reason: string }[] = [];

  for (const target of targets) {
    const tools = await fetchToolsForTarget(target).catch((error) => {
      const reason =
        error instanceof Error ? error.message : "Unknown error during fetch";
      console.warn(
        `Skipping "${target.name}" (${target.type}) — failed to fetch tools: ${reason}`
      );
      failedClients.push({ name: target.name, type: target.type, reason });
      return undefined;
    });

    if (!tools) {
      continue;
    }
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
  } else if (failedClients.length > 0) {
    throw new Error(
      `Failed to generate clients. ${failedClients.length} client${
        failedClients.length === 1 ? "" : "s"
      } could not be fetched.`
    );
  }
}

function resolveTargets(
  clientDefinitions: ClientDefinition[]
): ClientDefinition[] {
  if (clientDefinitions.length === 0) {
    throw new Error(
      "No clients found. Add entries to clients.ts (or point --clients to your config)."
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
  try {
    // In CI/unit tests we skip live discovery to avoid external calls.
    if (process.env.XMCP_CLI_TEST_MODE === "1") {
      const failingClients =
        process.env.XMCP_CLI_TEST_FAIL_CLIENTS?.split(",")
          .map((name) => name.trim())
          .filter(Boolean) ?? [];

      if (failingClients.includes(target.name)) {
        throw new Error(
          `Simulated fetch failure for "${target.name}" in test mode`
        );
      }
      return [];
    }

    if (target.type === "http") {
      const client = await createHTTPClient({
        url: target.url,
        headers: target.headers,
      });
      try {
        const { tools } = await client.listTools();
        return tools;
      } finally {
        await client.close().catch((error) => {
          console.warn(
            `Failed to close HTTP client for "${target.name}": ${
              error instanceof Error ? error.message : String(error)
            }`
          );
        });
      }
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
  } catch (error) {
    const reason =
      error instanceof Error ? error.message : "Unknown error during fetch";
    throw new Error(
      `Failed to fetch tools for "${target.name}" (${target.type}): ${reason}`
    );
  }
}
