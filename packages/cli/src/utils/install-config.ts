import fs from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { basename, dirname, resolve } from "node:path";
import { isDeepStrictEqual } from "node:util";

export type McpServerEntry =
  | {
      command: string;
      args: string[];
      env?: Record<string, string>;
      cwd?: string;
    }
  | { url: string; headers?: Record<string, string> };
export type McpConfig = Record<string, unknown> & {
  mcpServers: Record<string, unknown>;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export async function updateMcpConfig(
  file: string,
  name: string,
  entry: McpServerEntry,
  options: { dryRun: boolean; replace: boolean }
): Promise<{ config: McpConfig; path: string; changed: boolean }> {
  let path = resolve(file);
  let original: string | undefined;
  let mode = 0o600;
  try {
    // Preserve an existing symlink by replacing its real target, not the link.
    path = await fs.realpath(path);
    const stat = await fs.stat(path);
    if (!stat.isFile())
      throw new Error(`Config is not a regular file: ${path}`);
    mode = stat.mode & 0o777;
    original = await fs.readFile(path, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    // A dangling symlink must not be replaced as if it were a missing file.
    const link = await fs.lstat(path).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== "ENOENT") throw error;
      return undefined;
    });
    if (link) throw new Error(`Cannot read config target: ${path}`);
  }
  let parsed: unknown = {};
  if (original !== undefined) {
    try {
      parsed = JSON.parse(original.replace(/^\uFEFF/, ""));
    } catch {
      throw new Error(`Config must contain valid JSON: ${path}`);
    }
  }
  if (!isObject(parsed))
    throw new Error(`Config must be a JSON object: ${path}`);
  const servers = Object.hasOwn(parsed, "mcpServers") ? parsed.mcpServers : {};
  if (!isObject(servers))
    throw new Error(`mcpServers must be a JSON object: ${path}`);
  const unchanged =
    Object.hasOwn(servers, name) && isDeepStrictEqual(servers[name], entry);
  if (Object.hasOwn(servers, name) && !unchanged && !options.replace)
    throw new Error(
      `Server "${name}" already exists in ${path}. Use --replace to replace that entry.`
    );
  const config: McpConfig = {
    ...parsed,
    mcpServers: { ...servers, [name]: entry },
  };
  if (unchanged || options.dryRun) return { config, path, changed: !unchanged };

  await fs.mkdir(dirname(path), { recursive: true });
  const temporary = resolve(
    dirname(path),
    `.${basename(path)}.${randomUUID()}.tmp`
  );
  try {
    const handle = await fs.open(temporary, "wx", mode);
    try {
      await handle.writeFile(`${JSON.stringify(config, null, 2)}\n`, "utf8");
      await handle.chmod(mode);
      await handle.sync();
    } finally {
      await handle.close();
    }
    // Keep the original file intact until the complete new document is on disk.
    await fs.rename(temporary, path);
  } finally {
    await fs.rm(temporary, { force: true });
  }
  return { config, path, changed: true };
}
