import {
  McpServer,
  ProtocolError,
  ProtocolErrorCode,
} from "@modelcontextprotocol/server";
import { z } from "zod/v3";

import type { ComponentsConfig } from "@/config";
import type { SkillDefinition } from "@/types/skill";

import { filterComponents } from "./component-visibility";

/** Identifier of the MCP Skills extension (SEP-2640). */
export const SKILLS_EXTENSION = "io.modelcontextprotocol/skills";

// A single entry lists up to 512 files, so pages stay small enough to keep a
// large catalog from producing one oversized response.
const SKILLS_PAGE_SIZE = 50;
// Match the conservative cache hints the SDK applies to the other catalogs:
// middleware and visibility rules can make results differ between callers.
const CACHE_HINT = { ttlMs: 0, cacheScope: "private" } as const;

const listSkillsParamsSchema = z
  .object({ cursor: z.string().optional() })
  .passthrough()
  .optional();
const getSkillParamsSchema = z.object({ uri: z.string() }).passthrough();

function toSkillEntry({ uri, frontmatter, files }: SkillDefinition) {
  return {
    uri,
    frontmatter,
    resources: files.map(({ uri, digest, size }) => ({ uri, digest, size })),
  };
}

// The cursor is the offset of the next page. It carries everything needed to
// continue, so stateless HTTP keeps no listing state between requests.
function encodeCursor(offset: number): string {
  return btoa(String(offset));
}

function decodeCursor(cursor: string, total: number): number {
  let offset = Number.NaN;
  try {
    offset = Number(atob(cursor));
  } catch {
    // Reported as an invalid cursor below.
  }
  if (!Number.isSafeInteger(offset) || offset <= 0 || offset >= total) {
    throw new ProtocolError(
      ProtocolErrorCode.InvalidParams,
      `Invalid cursor: ${cursor}`
    );
  }
  return offset;
}

/**
 * Serves compiled skills through the MCP Skills extension: every file becomes
 * a `skill://` resource, and `skills/list` and `skills/get` publish the
 * entries. Servers without skills are left untouched.
 */
export function addSkillsToServer(
  server: McpServer,
  skills: readonly SkillDefinition[],
  components?: ComponentsConfig,
  onRegister?: (name: string, uri: string) => void
): McpServer {
  // Skills follow the same include/exclude name rules as other components.
  const visibleSkills = [
    ...filterComponents(
      new Map(
        skills.map((skill) => [
          skill.uri,
          { metadata: { name: skill.frontmatter.name }, skill },
        ])
      ),
      components
    ).values(),
  ].map(({ skill }) => skill);

  if (visibleSkills.length === 0) return server;

  for (const { frontmatter, files } of visibleSkills) {
    const skillRoot = files[0].uri.slice(0, files[0].uri.lastIndexOf("/") + 1);
    files.forEach(({ uri, mimeType, text, blob }, index) => {
      // SKILL.md is always first and takes its metadata from the frontmatter.
      const metadata =
        index === 0
          ? { mimeType, description: frontmatter.description }
          : { mimeType };
      const name =
        index === 0
          ? frontmatter.name
          : `${frontmatter.name}/${decodeURIComponent(uri.slice(skillRoot.length))}`;
      const content =
        text !== undefined
          ? { uri, mimeType, text }
          : { uri, mimeType, blob: blob ?? "" };

      onRegister?.(name, uri);
      server.registerResource(name, uri, metadata, () => ({
        contents: [content],
      }));
    });
  }

  const entries = visibleSkills.map(toSkillEntry);
  const entriesByUri = new Map(entries.map((entry) => [entry.uri, entry]));

  server.server.registerCapabilities({
    extensions: { [SKILLS_EXTENSION]: {} },
  });

  server.server.setRequestHandler(
    "skills/list",
    { params: listSkillsParamsSchema },
    (params) => {
      const start =
        params?.cursor === undefined
          ? 0
          : decodeCursor(params.cursor, entries.length);
      const end = start + SKILLS_PAGE_SIZE;
      return {
        skills: entries.slice(start, end),
        ...(end < entries.length ? { nextCursor: encodeCursor(end) } : {}),
        ...CACHE_HINT,
      };
    }
  );

  server.server.setRequestHandler(
    "skills/get",
    { params: getSkillParamsSchema },
    ({ uri }) => {
      const skill = entriesByUri.get(uri);
      if (!skill) {
        throw new ProtocolError(
          ProtocolErrorCode.InvalidParams,
          `No skill is served at ${uri}`
        );
      }
      return { skill, ...CACHE_HINT };
    }
  );

  return server;
}
