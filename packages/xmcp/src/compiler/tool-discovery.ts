import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { ToolMetadata } from "@/types/tool";

/** Auth/scope/dep data extracted at build time for validation and plumbing. */
export type ToolMetadataSnapshot = {
  dependsOn?: string[];
  requiresAuth?: boolean;
  requiredScopes?: string[];
  enabled?: boolean;
};

export type ResolvedToolEntry = {
  path: string;
  defaultName: string;
  canonicalName: string;
  metadataSnapshot: ToolMetadataSnapshot;
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

function extractMetadataSnapshot(metadata: unknown): ToolMetadataSnapshot {
  const snapshot: ToolMetadataSnapshot = {};
  if (typeof metadata !== "object" || metadata === null) return snapshot;

  const m = metadata as Partial<ToolMetadata>;
  if (Array.isArray(m.dependsOn)) snapshot.dependsOn = m.dependsOn as string[];
  if (typeof m.requiresAuth === "boolean")
    snapshot.requiresAuth = m.requiresAuth;
  if (Array.isArray(m.requiredScopes))
    snapshot.requiredScopes = m.requiredScopes as string[];
  if (typeof m.enabled === "boolean") snapshot.enabled = m.enabled;
  return snapshot;
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

/**
 * Validate the dependsOn graph and scope types at build time. Missing targets
 * and cycles are hard errors; non-string scopes are warnings since they fall
 * back gracefully at runtime.
 */
function validateToolMetadata(entries: ResolvedToolEntry[]): void {
  const byName = new Map<string, ResolvedToolEntry>();
  for (const e of entries) byName.set(e.canonicalName, e);

  for (const e of entries) {
    const deps = e.metadataSnapshot.dependsOn ?? [];
    for (const dep of deps) {
      if (!byName.has(dep)) {
        throw new Error(
          `[xmcp] Tool "${e.canonicalName}" depends on unknown tool "${dep}". Check the dependsOn array in "${e.path}".`
        );
      }
    }

    const scopes = e.metadataSnapshot.requiredScopes ?? [];
    for (const s of scopes) {
      if (typeof s !== "string") {
        console.warn(
          `[xmcp] Tool "${e.canonicalName}" has a non-string entry in requiredScopes (${JSON.stringify(s)}) in "${e.path}". Will be ignored at runtime.`
        );
      }
    }
  }

  // DFS cycle detection with white/gray/black coloring.
  const WHITE = 0;
  const GRAY = 1;
  const BLACK = 2;
  const color = new Map<string, number>();
  for (const e of entries) color.set(e.canonicalName, WHITE);

  const visit = (name: string, stack: string[]): void => {
    color.set(name, GRAY);
    stack.push(name);
    const deps = byName.get(name)?.metadataSnapshot.dependsOn ?? [];
    for (const dep of deps) {
      const c = color.get(dep);
      if (c === GRAY) {
        const idx = stack.indexOf(dep);
        const cycle = stack.slice(idx).concat(dep).join(" → ");
        throw new Error(`[xmcp] Dependency cycle: ${cycle}`);
      }
      if (c === WHITE) visit(dep, stack);
    }
    stack.pop();
    color.set(name, BLACK);
  };

  for (const e of entries) {
    if (color.get(e.canonicalName) === WHITE) {
      visit(e.canonicalName, []);
    }
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
            metadataSnapshot: extractMetadataSnapshot(metadata),
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
  validateToolMetadata(entries);
  return entries;
}
