import fs from "node:fs";
import path from "node:path";
import chalk from "chalk";
import { readConfig } from "@/compiler/parse-xmcp-config";
import { getResolvedPathsConfig } from "@/compiler/config/utils";
import { DEFAULT_PATHS } from "@/compiler/config/schemas";
import { xmcpLogo } from "@/utils/cli-icons";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FILE_TYPE = {
  tool: "tool",
  resource: "resource",
  prompt: "prompt",
} as const;

type FileType = (typeof FILE_TYPE)[keyof typeof FILE_TYPE];

const PLACEHOLDER_DESCRIPTION = "TODO: Add description";
const PLACEHOLDER_DESCRIPTION_REGEX = new RegExp(
  `description\\s*:\\s*["']${PLACEHOLDER_DESCRIPTION}["']`
);

// ---------------------------------------------------------------------------
// Result type (per throwing.md)
// ---------------------------------------------------------------------------

type Result<TValue, TError extends Error> =
  | { readonly ok: true; readonly value: TValue }
  | { readonly ok: false; readonly error: TError };

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * A single issue found in a validated file.
 * Discriminated union per kind — each variant owns its severity.
 */
type ValidationIssue =
  | { readonly kind: "missing-metadata-export"; readonly severity: "error" }
  | { readonly kind: "missing-default-export"; readonly severity: "error" }
  | { readonly kind: "missing-schema-export"; readonly severity: "warning" }
  | { readonly kind: "placeholder-description"; readonly severity: "warning" }
  | {
      readonly kind: "unreadable-file";
      readonly severity: "error";
      readonly reason: string;
    };

interface FileValidationResult {
  readonly filePath: string;
  readonly fileType: FileType;
  readonly issues: readonly ValidationIssue[];
}

interface ValidatePaths {
  readonly tools: string | null;
  readonly prompts: string | null;
  readonly resources: string | null;
}

export interface ValidateOptions {
  readonly tools: string | undefined;
  readonly prompts: string | undefined;
  readonly resources: string | undefined;
}

export interface ValidateSummary {
  readonly results: readonly FileValidationResult[];
  readonly totalErrors: number;
  readonly totalWarnings: number;
  readonly fileCount: number;
}

// ---------------------------------------------------------------------------
// Config resolution
// ---------------------------------------------------------------------------

/**
 * Resolves which directories to scan, combining xmcp config with CLI overrides.
 * Uses readConfig() which handles JSON → rspack-compiled TS → defaults.
 */
async function resolveValidatePaths(
  options: ValidateOptions
): Promise<Result<ValidatePaths, Error>> {
  try {
    const config = await readConfig();
    const raw = getResolvedPathsConfig(config);

    const paths: ValidatePaths = {
      tools: options.tools ?? raw.tools,
      prompts: options.prompts ?? raw.prompts,
      resources: options.resources ?? raw.resources,
    };

    return { ok: true, value: paths };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error
          : new Error("Failed to read xmcp config"),
    };
  }
}

// ---------------------------------------------------------------------------
// File scanning
// ---------------------------------------------------------------------------

/**
 * Scans a directory recursively for .ts and .tsx files.
 * Returns paths relative to the scanned directory, with forward slashes.
 * Returns an empty array if the directory does not exist.
 */
function scanDirectory(absoluteDir: string): readonly string[] {
  if (!fs.existsSync(absoluteDir)) {
    return [];
  }

  const entries = fs.readdirSync(absoluteDir, { recursive: true }) as string[];

  return entries
    .filter((entry) => entry.endsWith(".ts") || entry.endsWith(".tsx"))
    .map((entry) => entry.replace(/\\/g, "/"));
}

// ---------------------------------------------------------------------------
// Per-file reading
// ---------------------------------------------------------------------------

function readFile(filePath: string): Result<string, Error> {
  try {
    return { ok: true, value: fs.readFileSync(filePath, "utf8") };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error : new Error("Failed to read file"),
    };
  }
}

// ---------------------------------------------------------------------------
// Regex checks
// ---------------------------------------------------------------------------

function hasExportMetadata(content: string): boolean {
  return /^export\s+const\s+metadata\b/m.test(content);
}

function hasExportDefault(content: string): boolean {
  return /^export\s+default\b/m.test(content);
}

function hasExportSchema(content: string): boolean {
  return /^export\s+const\s+schema\b/m.test(content);
}

function hasPlaceholderDescription(content: string): boolean {
  return PLACEHOLDER_DESCRIPTION_REGEX.test(content);
}

// ---------------------------------------------------------------------------
// File validation
// ---------------------------------------------------------------------------

function validateFile(
  absoluteFilePath: string,
  relativeFilePath: string,
  fileType: FileType
): FileValidationResult {
  const readResult = readFile(absoluteFilePath);

  if (!readResult.ok) {
    return {
      filePath: relativeFilePath,
      fileType,
      issues: [
        {
          kind: "unreadable-file",
          severity: "error",
          reason: readResult.error.message,
        },
      ],
    };
  }

  const content = readResult.value;
  const issues: ValidationIssue[] = [];

  const metadataPresent = hasExportMetadata(content);

  if (!metadataPresent) {
    issues.push({ kind: "missing-metadata-export", severity: "error" });
  }

  if (!hasExportDefault(content)) {
    issues.push({ kind: "missing-default-export", severity: "error" });
  }

  if (fileType === FILE_TYPE.tool && !hasExportSchema(content)) {
    issues.push({ kind: "missing-schema-export", severity: "warning" });
  }

  // Only check for placeholder if metadata export is present — avoids noise
  // when the whole metadata block is missing.
  if (metadataPresent && hasPlaceholderDescription(content)) {
    issues.push({ kind: "placeholder-description", severity: "warning" });
  }

  return { filePath: relativeFilePath, fileType, issues };
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

const ISSUE_LABELS: Record<ValidationIssue["kind"], string> = {
  "missing-metadata-export": "missing export const metadata",
  "missing-default-export": "missing export default",
  "missing-schema-export": "missing export const schema",
  "placeholder-description": `description is still a placeholder ("${PLACEHOLDER_DESCRIPTION}")`,
  "unreadable-file": "could not read file",
};

function printValidationResults(summary: ValidateSummary): void {
  const { results, totalErrors, totalWarnings, fileCount } = summary;

  if (fileCount === 0) {
    console.log(`${xmcpLogo} No files found to validate.\n`);
    return;
  }

  console.log(`${xmcpLogo} Validating ${fileCount} file${fileCount === 1 ? "" : "s"}...\n`);

  for (const result of results) {
    const hasIssues = result.issues.length > 0;

    if (!hasIssues) {
      console.log(`  ${chalk.green("✔")}  ${chalk.dim(result.filePath)}`);
      continue;
    }

    console.log(`  ${chalk.red("✗")}  ${result.filePath}`);

    for (const issue of result.issues) {
      const label =
        issue.kind === "unreadable-file"
          ? `${ISSUE_LABELS[issue.kind]}: ${issue.reason}`
          : ISSUE_LABELS[issue.kind];

      if (issue.severity === "error") {
        console.log(`       ${chalk.red("error")}  ${label}`);
      } else {
        console.log(`       ${chalk.yellow("warn")}   ${label}`);
      }
    }
  }

  console.log("");

  if (totalErrors === 0 && totalWarnings === 0) {
    console.log(`  ${chalk.green("All files valid.")}\n`);
    return;
  }

  const parts: string[] = [];
  if (totalErrors > 0) {
    parts.push(chalk.red(`${totalErrors} error${totalErrors === 1 ? "" : "s"}`));
  }
  if (totalWarnings > 0) {
    parts.push(
      chalk.yellow(`${totalWarnings} warning${totalWarnings === 1 ? "" : "s"}`)
    );
  }

  const issueFiles = results.filter((r) => r.issues.length > 0).length;
  const verb = issueFiles === 1 ? "has" : "have";
  console.log(
    `  ${parts.join(", ")} — ${issueFiles} of ${fileCount} file${fileCount === 1 ? "" : "s"} ${verb} issues\n`
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Validates all tool, resource, and prompt files for common structural issues.
 * Reads xmcp config to determine directories (respects xmcp.config.ts via rspack).
 * CLI overrides in `options` take priority over config-derived paths.
 */
export async function runValidate(
  options: ValidateOptions
): Promise<ValidateSummary> {
  const pathsResult = await resolveValidatePaths(options);

  if (!pathsResult.ok) {
    console.error(
      chalk.red(`Failed to load xmcp config: ${pathsResult.error.message}`)
    );
    console.error(chalk.dim("Falling back to default paths.\n"));
  }

  const paths: ValidatePaths = pathsResult.ok
    ? pathsResult.value
    : { tools: DEFAULT_PATHS.tools, prompts: DEFAULT_PATHS.prompts, resources: DEFAULT_PATHS.resources };

  const cwd = process.cwd();
  const allResults: FileValidationResult[] = [];

  const directories: Array<{ dir: string | null; fileType: FileType }> = [
    { dir: paths.tools, fileType: FILE_TYPE.tool },
    { dir: paths.resources, fileType: FILE_TYPE.resource },
    { dir: paths.prompts, fileType: FILE_TYPE.prompt },
  ];

  for (const { dir, fileType } of directories) {
    if (dir === null) continue;

    const absoluteDir = path.resolve(cwd, dir);

    if (!fs.existsSync(absoluteDir)) {
      console.log(
        chalk.dim(
          `  Skipping ${fileType}s — directory not found: ${dir}\n`
        )
      );
      continue;
    }

    const relativeFiles = scanDirectory(absoluteDir);

    for (const relativeFile of relativeFiles) {
      const absoluteFilePath = path.join(absoluteDir, relativeFile);
      const displayPath = path
        .join(dir, relativeFile)
        .replace(/\\/g, "/");

      allResults.push(
        validateFile(absoluteFilePath, displayPath, fileType)
      );
    }
  }

  let totalErrors = 0;
  let totalWarnings = 0;

  for (const result of allResults) {
    for (const issue of result.issues) {
      if (issue.severity === "error") {
        totalErrors++;
      } else {
        totalWarnings++;
      }
    }
  }

  const summary: ValidateSummary = {
    results: allResults,
    totalErrors,
    totalWarnings,
    fileCount: allResults.length,
  };

  printValidationResults(summary);

  return summary;
}
