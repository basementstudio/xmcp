import { createHash } from "crypto";
import fs from "fs";
import path from "path";
import { isDeepStrictEqual } from "util";
import { parse as parseYaml } from "yaml";

/**
 * Build-time compilation of the skills directory for the MCP Skills extension
 * (io.modelcontextprotocol/skills). Every file is read, validated and embedded
 * here so the runtime never touches the filesystem, which Cloudflare Workers
 * does not have.
 */

/** A skill file with the content the runtime serves through resources/read. */
export interface CompiledSkillFile {
  uri: string;
  mimeType: string;
  /** `sha256:` plus 64 lowercase hex characters over the file's raw bytes. */
  digest: string;
  /** Byte length of the same raw bytes. */
  size: number;
  /** Valid UTF-8 content, served as `text`. */
  text?: string;
  /** Base64 of any other content, served as `blob`. */
  blob?: string;
}

export interface CompiledSkill {
  /** URI of the skill's SKILL.md. */
  uri: string;
  /** SKILL.md YAML frontmatter rendered as JSON. */
  frontmatter: { name: string; description: string; [key: string]: unknown };
  /** Every file of the skill, SKILL.md first. */
  files: CompiledSkillFile[];
}

export class SkillValidationError extends Error {
  constructor(public readonly problems: string[]) {
    super(
      `Invalid skill${problems.length === 1 ? "" : "s"}:\n${problems
        .map((problem) => `  - ${problem}`)
        .join("\n")}`
    );
    this.name = "SkillValidationError";
  }
}

export const SKILL_FILE_NAME = "SKILL.md";
// Per-skill limits fixed by the Skills extension. Hosts are only required to
// load skills up to these values.
export const MAX_SKILL_FILES = 512;
export const MAX_SKILL_BYTES = 16 * 1024 * 1024;
// Agent Skills naming rules: lowercase letters, numbers and single hyphens,
// with no leading or trailing hyphen.
const SKILL_NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_SKILL_NAME_LENGTH = 64;
const MAX_SKILL_DESCRIPTION_LENGTH = 1024;
const FRONTMATTER_PATTERN =
  /^---[ \t]*\r?\n(?:([\s\S]*?)\r?\n)?---[ \t]*(?:\r?\n|$)/;

const MIME_TYPES: Record<string, string> = {
  ".md": "text/markdown",
  ".txt": "text/plain",
  ".json": "application/json",
  ".yaml": "application/yaml",
  ".yml": "application/yaml",
  ".toml": "application/toml",
  ".xml": "application/xml",
  ".csv": "text/csv",
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".ts": "text/x-typescript",
  ".py": "text/x-python",
  ".sh": "application/x-sh",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
  ".zip": "application/zip",
};

function normalize(value: string): string {
  return value.replace(/\\/g, "/").replace(/^\.\//, "").replace(/\/+$/, "");
}

/**
 * Decodes bytes as text only when re-encoding yields the same bytes, so the
 * text a client receives hashes to the published digest. A byte order mark is
 * kept for the same reason.
 */
function decodeUtf8(bytes: Buffer): string | undefined {
  try {
    const text = new TextDecoder("utf-8", {
      fatal: true,
      ignoreBOM: true,
    }).decode(bytes);
    return Buffer.from(text, "utf8").equals(bytes) ? text : undefined;
  } catch {
    return undefined;
  }
}

function toSkillUri(skillName: string, filePath: string): string {
  return `skill://${skillName}/${filePath
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
}

function parseFrontmatter(
  text: string,
  location: string,
  problems: string[]
): CompiledSkill["frontmatter"] | undefined {
  const match = FRONTMATTER_PATTERN.exec(text);
  if (!match) {
    problems.push(
      `${location} must begin with YAML frontmatter between "---" lines`
    );
    return undefined;
  }

  let frontmatter: unknown;
  try {
    frontmatter = parseYaml(match[1] ?? "");
  } catch (error) {
    problems.push(
      `${location} has invalid YAML frontmatter: ${error instanceof Error ? error.message : String(error)}`
    );
    return undefined;
  }

  if (
    typeof frontmatter !== "object" ||
    frontmatter === null ||
    Array.isArray(frontmatter)
  ) {
    problems.push(`${location} frontmatter must be a YAML mapping`);
    return undefined;
  }
  // The frontmatter is published as JSON and hosts compare it field by field
  // with the served SKILL.md, so values JSON cannot carry would never match.
  if (
    !isDeepStrictEqual(JSON.parse(JSON.stringify(frontmatter)), frontmatter)
  ) {
    problems.push(
      `${location} frontmatter must only contain values that JSON can represent`
    );
    return undefined;
  }
  return frontmatter as CompiledSkill["frontmatter"];
}

function validateFrontmatter(
  frontmatter: CompiledSkill["frontmatter"],
  directoryName: string,
  location: string,
  problems: string[]
): boolean {
  const before = problems.length;
  const { name, description } = frontmatter as Record<string, unknown>;

  if (typeof name !== "string" || name.length === 0) {
    problems.push(`${location} frontmatter must have a "name"`);
  } else if (name !== directoryName) {
    problems.push(
      `${location} frontmatter name "${name}" must equal its directory name "${directoryName}"`
    );
  } else if (
    name.length > MAX_SKILL_NAME_LENGTH ||
    !SKILL_NAME_PATTERN.test(name)
  ) {
    problems.push(
      `${location} name "${name}" is not a valid skill name: use at most ${MAX_SKILL_NAME_LENGTH} lowercase letters, numbers and single hyphens, without a leading or trailing hyphen`
    );
  }

  if (typeof description !== "string" || description.trim().length === 0) {
    problems.push(`${location} frontmatter must have a "description"`);
  } else if (description.length > MAX_SKILL_DESCRIPTION_LENGTH) {
    problems.push(
      `${location} description must be at most ${MAX_SKILL_DESCRIPTION_LENGTH} characters`
    );
  }
  return problems.length === before;
}

/**
 * Compiles `<skillsPath>/<skill-name>/**` into skill entries. `filePaths` are
 * the project-relative files found under `skillsPath`.
 *
 * @throws SkillValidationError listing every invalid skill
 */
export function compileSkills(
  skillsPath: string,
  filePaths: Iterable<string>,
  cwd: string = process.cwd()
): CompiledSkill[] {
  const root = normalize(skillsPath);
  const problems: string[] = [];
  const filesBySkill = new Map<string, string[]>();

  for (const rawPath of filePaths) {
    const filePath = normalize(rawPath);
    if (!filePath.startsWith(`${root}/`)) continue;
    const [directoryName, ...rest] = filePath.slice(root.length + 1).split("/");
    if (rest.length === 0) {
      problems.push(
        `${filePath} is not inside a skill directory. Move it to ${root}/<skill-name>/`
      );
      continue;
    }
    const files = filesBySkill.get(directoryName) ?? [];
    files.push(rest.join("/"));
    filesBySkill.set(directoryName, files);
  }

  const skills: CompiledSkill[] = [];
  for (const directoryName of [...filesBySkill.keys()].sort()) {
    const directory = `${root}/${directoryName}`;
    const location = `${directory}/${SKILL_FILE_NAME}`;
    const relativePaths = filesBySkill.get(directoryName)!.sort();

    if (!relativePaths.includes(SKILL_FILE_NAME)) {
      problems.push(`${directory} has no ${SKILL_FILE_NAME}`);
      continue;
    }
    if (relativePaths.length > MAX_SKILL_FILES) {
      problems.push(
        `${directory} has ${relativePaths.length} files; a skill can have at most ${MAX_SKILL_FILES}`
      );
      continue;
    }

    const before = problems.length;
    let totalBytes = 0;
    let frontmatter: CompiledSkill["frontmatter"] | undefined;
    const files: CompiledSkillFile[] = [];
    // SKILL.md leads the manifest; the rest keep a stable sorted order.
    for (const relativePath of [
      SKILL_FILE_NAME,
      ...relativePaths.filter((file) => file !== SKILL_FILE_NAME),
    ]) {
      const bytes = fs.readFileSync(path.resolve(cwd, directory, relativePath));
      totalBytes += bytes.byteLength;
      const text = decodeUtf8(bytes);
      const isSkillFile = relativePath === SKILL_FILE_NAME;
      const uri = toSkillUri(directoryName, relativePath);

      if (new URL(uri).href !== uri) {
        problems.push(
          `${directory}/${relativePath} cannot be addressed by a stable URI. Rename the file`
        );
        continue;
      }
      if (isSkillFile) {
        if (text === undefined) {
          problems.push(`${location} must be valid UTF-8`);
          continue;
        }
        frontmatter = parseFrontmatter(text, location, problems);
        if (
          frontmatter &&
          !validateFrontmatter(frontmatter, directoryName, location, problems)
        ) {
          frontmatter = undefined;
        }
      }

      files.push({
        uri,
        mimeType: isSkillFile
          ? "text/markdown"
          : (MIME_TYPES[path.extname(relativePath).toLowerCase()] ??
            (text === undefined ? "application/octet-stream" : "text/plain")),
        digest: `sha256:${createHash("sha256").update(bytes).digest("hex")}`,
        size: bytes.byteLength,
        ...(text === undefined ? { blob: bytes.toString("base64") } : { text }),
      });
    }

    if (totalBytes > MAX_SKILL_BYTES) {
      problems.push(
        `${directory} is ${totalBytes} bytes; a skill can be at most ${MAX_SKILL_BYTES} bytes (16 MiB)`
      );
    }
    if (problems.length > before || !frontmatter) continue;

    skills.push({ uri: files[0].uri, frontmatter, files });
  }

  if (problems.length > 0) throw new SkillValidationError(problems);
  return skills;
}
