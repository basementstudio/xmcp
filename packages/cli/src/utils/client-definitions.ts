import fs from "node:fs";
import path from "node:path";
import { bundleRequire } from "bundle-require";
import { CustomHeaders } from "xmcp";

export type StdioIOStrategy = "pipe" | "inherit" | "ignore";

export type HttpClientDefinition = {
  type: "http";
  name: string;
  url: string;
  headers?: CustomHeaders;
};

export type StdioClientDefinition = {
  type: "stdio";
  name: string;
  command: string;
  args: string[];
  npm?: string;
  npmArgs?: string[];
  env?: Record<string, string>;
  cwd?: string;
  stderr?: StdioIOStrategy;
};

export type ClientDefinition = HttpClientDefinition | StdioClientDefinition;

export type LoadedClients = {
  definitions: ClientDefinition[];
  sourcePath: string;
};

export async function loadClientDefinitions(
  customPath: string | undefined,
  defaultPath: string
): Promise<LoadedClients | undefined> {
  const searchPaths = customPath
    ? [customPath]
    : [defaultPath, "clients.ts", "src/clients.ts"];

  for (const candidate of searchPaths) {
    if (!candidate) continue;
    const absolutePath = path.resolve(process.cwd(), candidate);
    if (!fsExists(absolutePath)) continue;

    const { mod } = await bundleRequire({
      filepath: absolutePath,
      format: "esm",
    });

    const exported =
      (mod && "clients" in mod ? (mod as any).clients : undefined) ??
      (mod && "default" in mod ? (mod as any).default : undefined) ??
      mod;

    const definitions = normalizeClientDefinitions(exported);
    if (definitions && definitions.length > 0) {
      return {
        definitions,
        sourcePath: absolutePath,
      };
    }
  }

  return undefined;
}

function fsExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

function normalizeClientDefinitions(
  value: unknown
): ClientDefinition[] | undefined {
  if (!value) {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value
      .map((entry, index) =>
        createClientDefinition(
          entry,
          typeof index === "number" ? `client${index + 1}` : undefined
        )
      )
      .filter((entry): entry is ClientDefinition => Boolean(entry));
  }

  if (typeof value === "object") {
    return Object.entries(value).reduce<ClientDefinition[]>(
      (acc, [key, entry]) => {
        const definition = createClientDefinition(entry, key);
        if (definition) {
          acc.push(definition);
        }
        return acc;
      },
      []
    );
  }

  return undefined;
}

function isValidHeader(header: unknown): boolean {
  if (!header || typeof header !== "object") return false;
  const h = header as Record<string, unknown>;
  if (typeof h.name !== "string") return false;
  // Must have either 'value' (static) or 'env' (environment variable reference)
  return typeof h.value === "string" || typeof h.env === "string";
}

function createClientDefinition(
  entry: unknown,
  fallbackName?: string
): ClientDefinition | undefined {
  if (typeof entry === "string") {
    return fallbackName
      ? {
          type: "http",
          name: fallbackName,
          url: entry,
        }
      : undefined;
  }

  if (!isRecord(entry)) {
    return undefined;
  }

  const nameProp = typeof entry.name === "string" ? entry.name : fallbackName;
  if (!nameProp) {
    return undefined;
  }

  const urlProp = typeof entry.url === "string" ? entry.url : undefined;
  let headersProp: CustomHeaders | undefined;
  if (Array.isArray(entry.headers)) {
    headersProp = entry.headers.filter(isValidHeader) as CustomHeaders;
  }

  if (urlProp) {
    return {
      type: "http",
      name: nameProp,
      url: urlProp,
      headers: headersProp,
    };
  }

  const transportType =
    typeof entry.type === "string" ? entry.type.toLowerCase() : undefined;
  const npmProp =
    typeof entry.npm === "string"
      ? entry.npm
      : typeof (entry as Record<string, unknown>).package === "string"
        ? ((entry as Record<string, unknown>).package as string)
        : undefined;
  const commandProp =
    typeof entry.command === "string" ? entry.command : undefined;
  const shouldUseStdio = transportType === "stdio" || npmProp || commandProp;

  if (shouldUseStdio) {
    const sanitizedArgs = sanitizeStringArray(entry.args);
    const envProp = sanitizeEnvRecord(entry.env);
    const cwdProp = typeof entry.cwd === "string" ? entry.cwd : undefined;
    const stderrProp = parseStdioStrategy(entry.stderr);

    const command = commandProp ?? (npmProp ? "npx" : undefined);
    if (!command) {
      return undefined;
    }

    const npmArgs = npmProp ? sanitizedArgs : undefined;
    const finalArgs = npmProp
      ? [npmProp as string, ...sanitizedArgs]
      : sanitizedArgs;

    return {
      type: "stdio",
      name: nameProp,
      command,
      args: finalArgs,
      npm: npmProp,
      npmArgs,
      env: envProp,
      cwd: cwdProp,
      stderr: stderrProp,
    };
  }

  return undefined;
}

function isRecord(value: unknown): value is Record<string, any> {
  return Boolean(value && typeof value === "object");
}

function sanitizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter(
    (item): item is string => typeof item === "string"
  ) as string[];
}

function sanitizeEnvRecord(value: unknown): Record<string, string> | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const entries = Object.entries(value as Record<string, unknown>).filter(
    ([, v]) => typeof v === "string"
  ) as [string, string][];

  if (entries.length === 0) {
    return undefined;
  }

  return Object.fromEntries(entries);
}

function parseStdioStrategy(value: unknown): StdioIOStrategy | undefined {
  if (value === "pipe" || value === "inherit" || value === "ignore") {
    return value;
  }
  return undefined;
}
