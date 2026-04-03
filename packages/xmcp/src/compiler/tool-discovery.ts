import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { ToolMetadata } from "@/types/tool";

export type ResolvedToolEntry = {
  path: string;
  defaultName: string;
  canonicalName: string;
};

function defaultToolNameFromPath(toolPath: string): string {
  const fileName = toolPath.split("/").pop() || toolPath;
  return fileName.replace(/\.[^/.]+$/, "");
}

function resolveCanonicalToolName(
  metadata: unknown,
  defaultName: string
): string {
  if (typeof metadata !== "object" || metadata === null) {
    return defaultName;
  }

  const { name } = metadata as Partial<ToolMetadata>;
  return typeof name === "string" && name.length > 0 ? name : defaultName;
}

async function importToolModule(toolPath: string): Promise<unknown> {
  const absolutePath = path.resolve(process.cwd(), toolPath);
  const mtimeMs = fs.statSync(absolutePath).mtimeMs;
  const fileUrl = pathToFileURL(absolutePath);
  fileUrl.searchParams.set("xmcp-tool-mtime", String(mtimeMs));
  return import(/* webpackIgnore: true */ fileUrl.href);
}

function assertNoDuplicateToolNames(entries: ResolvedToolEntry[]): void {
  const seen = new Map<string, ResolvedToolEntry>();

  for (const entry of entries) {
    const existing = seen.get(entry.canonicalName);
    if (!existing) {
      seen.set(entry.canonicalName, entry);
      continue;
    }

    throw new Error(
      `[xmcp] Duplicate tool name "${entry.canonicalName}" found in "${existing.path}" and "${entry.path}". Rename one tool or remove one file.`
    );
  }
}

export async function resolveToolEntries(
  toolPaths: Set<string>
): Promise<ResolvedToolEntry[]> {
  const entries = await Promise.all(
    Array.from(toolPaths)
      .sort()
      .map(async (toolPath) => {
        const defaultName = defaultToolNameFromPath(toolPath);

        try {
          const toolModule = await importToolModule(toolPath);
          const metadata =
            typeof toolModule === "object" && toolModule !== null
              ? (toolModule as { metadata?: unknown }).metadata
              : undefined;

          return {
            path: toolPath,
            defaultName,
            canonicalName: resolveCanonicalToolName(metadata, defaultName),
          };
        } catch (error) {
          throw new Error(
            `[xmcp] Failed to resolve tool metadata for "${toolPath}". ` +
              `Tool discovery needs a canonical name at build time.\n` +
              `Original error: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      })
  );

  assertNoDuplicateToolNames(entries);
  return entries;
}
