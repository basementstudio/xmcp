import type { PromptFile } from "./server";

const EMPTY_PROMPT_FILE_MESSAGE = "File is empty.";
const MISSING_DEFAULT_EXPORT_MESSAGE =
  "File does not export a default prompt handler.";
const INVALID_DEFAULT_EXPORT_MESSAGE =
  "Default export must be a prompt handler function.";

type PromptLoadIssue = {
  path: string;
  message: string;
};

function createPromptLoadIssue(path: string): PromptLoadIssue {
  return {
    path,
    message: EMPTY_PROMPT_FILE_MESSAGE,
  };
}

function createInvalidPromptImplementationError(path: string): Error {
  return new Error(
    `[xmcp] Invalid prompt file: ${path}\n   -> ${INVALID_DEFAULT_EXPORT_MESSAGE}`
  );
}

function classifyPromptModule(
  promptModule: unknown,
  path: string
): "empty" | "missing-default" | "valid" {
  if (typeof promptModule !== "object" || promptModule === null) {
    throw createInvalidPromptImplementationError(path);
  }

  const moduleRecord = promptModule as Record<string, unknown>;
  const keys = Object.keys(moduleRecord);
  const defaultExport = moduleRecord.default;
  const nonInteropKeys = keys.filter((key) => key !== "__esModule");

  if (
    keys.length === 0 ||
    (nonInteropKeys.length === 1 &&
      nonInteropKeys[0] === "default" &&
      typeof defaultExport === "object" &&
      defaultExport !== null &&
      Object.keys(defaultExport as Record<string, unknown>).length === 0)
  ) {
    return "empty";
  }

  if (!("default" in moduleRecord) || moduleRecord.default === undefined) {
    return "missing-default";
  }

  if (typeof moduleRecord.default !== "function") {
    throw createInvalidPromptImplementationError(path);
  }

  return "valid";
}

function toPromptFile(promptModule: unknown): PromptFile {
  return promptModule as PromptFile;
}

export async function loadPromptModules(
  loaders: Record<string, () => Promise<unknown>>
) {
  const promptModules = new Map<string, PromptFile>();
  const skippedPrompts: PromptLoadIssue[] = [];

  const results = await Promise.all(
    Object.entries(loaders).map(async ([path, loadPrompt]) => {
      const promptModule = await loadPrompt();
      const classification = classifyPromptModule(promptModule, path);

      if (classification === "empty") {
        return {
          skipped: true as const,
          issue: createPromptLoadIssue(path),
        };
      }

      if (classification === "missing-default") {
        return {
          skipped: true as const,
          issue: {
            path,
            message: MISSING_DEFAULT_EXPORT_MESSAGE,
          },
        };
      }

      return {
        skipped: false as const,
        path,
        promptModule: toPromptFile(promptModule),
      };
    })
  );

  for (const result of results) {
    if (result.skipped) {
      skippedPrompts.push(result.issue);
      continue;
    }

    promptModules.set(result.path, result.promptModule);
  }

  return {
    promptModules,
    skippedPrompts,
  };
}

function createPromptLoadIssueReporter(
  logger: Pick<Console, "warn"> = console
) {
  let lastReportedSummaryKey = "";

  return (skippedPrompts: PromptLoadIssue[]) => {
    const summaryKey = skippedPrompts
      .map(({ path, message }) => `${path}:${message}`)
      .sort()
      .join("|");

    if (summaryKey === lastReportedSummaryKey) {
      return;
    }

    lastReportedSummaryKey = summaryKey;

    if (skippedPrompts.length === 0) {
      return;
    }

    skippedPrompts.forEach(({ path, message }) => {
      logger.warn(
        `[xmcp] Failed to load prompt file: ${path}\n   -> ${message}`
      );
    });

    const count = skippedPrompts.length;
    logger.warn(
      `[xmcp] ${count} prompt${count === 1 ? "" : "s"} skipped due to empty files or missing default exports`
    );
  };
}

export const reportPromptLoadIssues = createPromptLoadIssueReporter();
