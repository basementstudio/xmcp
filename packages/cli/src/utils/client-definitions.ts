import fs from "node:fs";
import path from "node:path";
import { bundleRequire } from "bundle-require";

export type ClientDefinition = {
  name: string;
  url: string;
};

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

function createClientDefinition(
  entry: unknown,
  fallbackName?: string
): ClientDefinition | undefined {
  if (typeof entry === "string") {
    return fallbackName
      ? {
          name: fallbackName,
          url: entry,
        }
      : undefined;
  }

  if (!entry || typeof entry !== "object") {
    return undefined;
  }

  const nameProp =
    "name" in entry && typeof (entry as any).name === "string"
      ? (entry as any).name
      : fallbackName;
  const urlProp =
    "url" in entry && typeof (entry as any).url === "string"
      ? (entry as any).url
      : undefined;

  if (!nameProp || !urlProp) {
    return undefined;
  }

  return {
    name: nameProp,
    url: urlProp,
  };
}
