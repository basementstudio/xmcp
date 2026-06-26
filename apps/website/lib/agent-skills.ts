import fs from "fs";
import path from "path";
import { createHash } from "crypto";

/**
 * Root of the published Agent Skills, served under
 * `/.well-known/agent-skills/`. Each subdirectory is one skill with a
 * `SKILL.md` and optional `references/` files. These are read at build time
 * (the routes are `force-static`), so content is baked into the static output
 * and the index digests can never drift from the bytes that get served.
 */
const SKILLS_ROOT = path.join(process.cwd(), "agent-skills");

/** Extensions exposed over HTTP. Skills are markdown only. */
const SERVABLE_EXTENSIONS = new Set([".md"]);

export interface AgentSkill {
  /** Published skill name; also the URL path segment. */
  name: string;
  /** Mirrors the `description` in the skill's SKILL.md frontmatter. */
  description: string;
  /** Directory name under {@link SKILLS_ROOT}. */
  dir: string;
}

/** Read a single-line value for `key` out of YAML frontmatter. */
function frontmatterValue(source: string, key: string): string | undefined {
  const block = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!block) return undefined;
  for (const line of block[1].split(/\r?\n/)) {
    // Only top-level keys (no leading whitespace) so nested `metadata:` fields
    // are ignored.
    const field = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (field && field[1] === key) {
      return field[2].trim().replace(/^["']|["']$/g, "");
    }
  }
  return undefined;
}

/** Every published skill, derived from the directories under SKILLS_ROOT. */
export function listSkills(): AgentSkill[] {
  return fs
    .readdirSync(SKILLS_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const dir = entry.name;
      const source = fs.readFileSync(
        path.join(SKILLS_ROOT, dir, "SKILL.md"),
        "utf8"
      );
      return {
        dir,
        name: frontmatterValue(source, "name") ?? dir,
        description: frontmatterValue(source, "description") ?? "",
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** `sha256:{hex}` content digest, per the Agent Skills Discovery RFC. */
export function digest(bytes: Buffer): string {
  return `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
}

/** Raw bytes of a skill's SKILL.md — used for both serving and digesting. */
export function readSkillMarkdown(dir: string): Buffer {
  return fs.readFileSync(path.join(SKILLS_ROOT, dir, "SKILL.md"));
}

/**
 * Resolve URL `segments` (the path after `/.well-known/agent-skills/`) to a
 * skill file's raw bytes, or `null` if the path escapes SKILLS_ROOT, isn't a
 * markdown file, or doesn't exist. Guards against path traversal.
 */
export function readSkillFile(segments: string[]): string | null {
  if (segments.length === 0) return null;
  const target = path.resolve(SKILLS_ROOT, ...segments);
  const root = path.resolve(SKILLS_ROOT);
  if (target !== root && !target.startsWith(root + path.sep)) return null;
  if (!SERVABLE_EXTENSIONS.has(path.extname(target))) return null;
  try {
    if (!fs.statSync(target).isFile()) return null;
    // Skills are utf8 markdown; serving the decoded text round-trips to the
    // same bytes, so the index digest (over raw bytes) still matches.
    return fs.readFileSync(target, "utf8");
  } catch {
    return null;
  }
}

/**
 * Every servable file path (as URL segments) across all skills, e.g.
 * `["mcp-server-design", "SKILL.md"]` and
 * `["mcp-server-design", "references", "design-principles.md"]`. Used to
 * prerender the catch-all route via `generateStaticParams`.
 */
export function listSkillFiles(): string[][] {
  const files: string[][] = [];
  for (const skill of listSkills()) {
    walk(path.join(SKILLS_ROOT, skill.dir), [skill.dir], files);
  }
  return files;
}

function walk(absDir: string, prefix: string[], out: string[][]): void {
  for (const entry of fs.readdirSync(absDir, { withFileTypes: true })) {
    const next = [...prefix, entry.name];
    if (entry.isDirectory()) {
      walk(path.join(absDir, entry.name), next, out);
    } else if (SERVABLE_EXTENSIONS.has(path.extname(entry.name))) {
      out.push(next);
    }
  }
}
