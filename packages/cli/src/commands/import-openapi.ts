import {
  chmod,
  link,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import { resolve } from "node:path";
import { buildOpenApiTools, type OpenApiOptions } from "../utils/openapi.js";

export interface ImportOpenApiOptions extends OpenApiOptions {
  file?: string;
  out?: string;
  help: boolean;
  overwrite?: boolean;
}

export function parseImportOpenApiOptions(
  args: string[]
): ImportOpenApiOptions {
  const options: ImportOpenApiOptions = { help: false };
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === "--help" || arg === "-h") options.help = true;
    else if (arg === "--overwrite") options.overwrite = true;
    else if (
      ["--operations", "--base-url", "--auth-env", "--out", "-o"].includes(arg)
    ) {
      const value = args[++index];
      if (!value?.trim() || value.startsWith("-"))
        throw new Error(`${arg} requires a value.`);
      if (arg === "--operations") {
        const ids = value.split(",").map((id) => id.trim());
        if (ids.some((id) => !id))
          throw new Error(
            "--operations requires comma-separated operation IDs."
          );
        options.operations = [...(options.operations ?? []), ...ids];
      } else if (arg === "--base-url") options.baseUrl = value;
      else if (arg === "--auth-env") options.authEnv = value;
      else options.out = value;
    } else if (arg.startsWith("-")) throw new Error(`Unknown option ${arg}.`);
    else if (options.file) throw new Error("Expected one OpenAPI JSON file.");
    else options.file = arg;
  }
  if (!options.help && !options.file)
    throw new Error("Provide an OpenAPI JSON file.");
  return options;
}

export async function runImportOpenApi(
  options: ImportOpenApiOptions
): Promise<string[]> {
  if (!options.file) throw new Error("Provide an OpenAPI JSON file.");
  const source = await readFile(resolve(options.file), "utf8");
  let input: unknown;
  try {
    input = JSON.parse(source.replace(/^\uFEFF/, ""));
  } catch {
    throw new Error(
      "OpenAPI input must be valid JSON (YAML is not supported)."
    );
  }
  const tools = buildOpenApiTools(input, options);
  const directory = resolve(options.out ?? "src/tools");
  // Validate every operation and destination before writing. Never follow symlinks.
  const replacements = new Map<string, number>();
  for (const tool of tools)
    for (const extension of ["ts", "tsx"]) {
      const destination = resolve(directory, `${tool.name}.${extension}`);
      const existing = await lstat(destination).catch(
        (error: NodeJS.ErrnoException) => {
          if (error.code !== "ENOENT") throw error;
          return undefined;
        }
      );
      if (!existing) continue;
      if (!options.overwrite)
        throw new Error(
          `Refusing to overwrite ${destination}. Use --overwrite to replace generated .ts files.`
        );
      if (extension !== "ts" || !existing.isFile())
        throw new Error(
          `Cannot overwrite ${destination}: only regular .ts files can be replaced.`
        );
      replacements.set(destination, existing.mode);
    }
  await mkdir(directory, { recursive: true });
  // Stage every file before publishing. Each replacement is an atomic rename on
  // the same filesystem, so a write failure never truncates an existing tool.
  const staging = await mkdtemp(resolve(directory, ".xmcp-import-"));
  const created: string[] = [];
  const destinations = tools.map((tool) =>
    resolve(directory, `${tool.name}.ts`)
  );
  try {
    for (const [index, tool] of tools.entries()) {
      const staged = resolve(staging, `${tool.name}.ts`);
      await writeFile(staged, tool.content, "utf8");
      const mode = replacements.get(destinations[index]);
      if (mode !== undefined) await chmod(staged, mode);
    }
    for (const [index, tool] of tools.entries()) {
      const staged = resolve(staging, `${tool.name}.ts`);
      const destination = destinations[index];
      if (replacements.has(destination)) await rename(staged, destination);
      else {
        // link refuses a destination created since preflight, unlike rename.
        await link(staged, destination);
        created.push(destination);
      }
    }
  } catch (error) {
    await Promise.all(created.map((path) => rm(path, { force: true })));
    throw error;
  } finally {
    await rm(staging, { recursive: true, force: true });
  }
  return destinations;
}
