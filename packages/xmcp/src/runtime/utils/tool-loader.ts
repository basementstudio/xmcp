import type { ToolFile } from "./server";

const EMPTY_TOOL_FILE_MESSAGE = "File is empty.";
const MISSING_DEFAULT_EXPORT_MESSAGE =
  "File does not export a default tool handler.";
const INVALID_DEFAULT_EXPORT_MESSAGE =
  "Default export must be a tool handler function.";

type ToolLoadIssue = {
  path: string;
  message: string;
};

function createToolLoadIssue(path: string): ToolLoadIssue {
  return {
    path,
    message: EMPTY_TOOL_FILE_MESSAGE,
  };
}

function createInvalidToolImplementationError(path: string): Error {
  return new Error(
    `[xmcp] Invalid tool file: ${path}\n   -> ${INVALID_DEFAULT_EXPORT_MESSAGE}`
  );
}

function classifyToolModule(
  toolModule: unknown,
  path: string
): "empty" | "missing-default" | "valid" {
  if (typeof toolModule !== "object" || toolModule === null) {
    throw createInvalidToolImplementationError(path);
  }

  const moduleRecord = toolModule as Record<string, unknown>;
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
    throw createInvalidToolImplementationError(path);
  }

  return "valid";
}

function toToolFile(toolModule: unknown): ToolFile {
  return toolModule as ToolFile;
}

export async function loadToolModules(
  loaders: Record<string, () => Promise<unknown>>
) {
  const toolModules = new Map<string, ToolFile>();
  const skippedTools: ToolLoadIssue[] = [];

  const results = await Promise.all(
    Object.entries(loaders).map(async ([path, loadTool]) => {
      const toolModule = await loadTool();
      const classification = classifyToolModule(toolModule, path);

      if (classification === "empty") {
        return {
          skipped: true as const,
          issue: createToolLoadIssue(path),
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
        toolModule: toToolFile(toolModule),
      };
    })
  );

  for (const result of results) {
    if (result.skipped) {
      skippedTools.push(result.issue);
      continue;
    }

    toolModules.set(result.path, result.toolModule);
  }

  return {
    toolModules,
    skippedTools,
  };
}

function createToolLoadIssueReporter(
  logger: Pick<Console, "warn"> = console
) {
  let lastReportedSummaryKey = "";

  return (skippedTools: ToolLoadIssue[]) => {
    const summaryKey = skippedTools
      .map(({ path, message }) => `${path}:${message}`)
      .sort()
      .join("|");

    if (summaryKey === lastReportedSummaryKey) {
      return;
    }

    lastReportedSummaryKey = summaryKey;

    if (skippedTools.length === 0) {
      return;
    }

    skippedTools.forEach(({ path, message }) => {
      logger.warn(`[xmcp] Failed to load tool file: ${path}\n   -> ${message}`);
    });

    const count = skippedTools.length;
    logger.warn(
      `[xmcp] ${count} tool${count === 1 ? "" : "s"} skipped due to empty files or missing default exports`
    );
  };
}

export const reportToolLoadIssues = createToolLoadIssueReporter();
