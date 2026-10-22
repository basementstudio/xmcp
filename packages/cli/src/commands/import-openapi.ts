import { lstat, mkdir, open, readFile, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { buildOpenApiTools, type OpenApiOptions } from "../utils/openapi.js";

export interface ImportOpenApiOptions extends OpenApiOptions {
  file?: string;
  out?: string;
  help: boolean;
}

export function parseImportOpenApiOptions(
  args: string[]
): ImportOpenApiOptions {
  const options: ImportOpenApiOptions = { help: false };
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === "--help" || arg === "-h") options.help = true;
    else if (["--operations", "--base-url", "--out", "-o"].includes(arg)) {
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
  // Validate every operation and destination before creating any files.
  for (const tool of tools)
    for (const extension of ["ts", "tsx"]) {
      const destination = resolve(directory, `${tool.name}.${extension}`);
      const exists = await lstat(destination).then(
        () => true,
        (error: NodeJS.ErrnoException) => {
          if (error.code !== "ENOENT") throw error;
          return false;
        }
      );
      if (exists)
        throw new Error(
          `Refusing to overwrite ${destination}. Choose another --out directory.`
        );
    }
  await mkdir(directory, { recursive: true });
  const created: string[] = [];
  try {
    for (const tool of tools) {
      const destination = resolve(directory, `${tool.name}.ts`);
      const handle = await open(destination, "wx");
      created.push(destination);
      try {
        await handle.writeFile(tool.content, "utf8");
      } finally {
        await handle.close();
      }
    }
  } catch (error) {
    await Promise.all(created.map((path) => rm(path, { force: true })));
    throw error;
  }
  return created;
}
