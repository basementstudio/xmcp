import type { ResourceFile } from "./server";

const EMPTY_RESOURCE_FILE_MESSAGE = "File is empty.";
const MISSING_DEFAULT_EXPORT_MESSAGE =
  "File does not export a default resource handler.";
const INVALID_DEFAULT_EXPORT_MESSAGE =
  "Default export must be a resource handler function.";

type ResourceLoadIssue = {
  path: string;
  message: string;
};

function createResourceLoadIssue(path: string): ResourceLoadIssue {
  return {
    path,
    message: EMPTY_RESOURCE_FILE_MESSAGE,
  };
}

function createInvalidResourceImplementationError(path: string): Error {
  return new Error(
    `[xmcp] Invalid resource file: ${path}\n   -> ${INVALID_DEFAULT_EXPORT_MESSAGE}`
  );
}

function classifyResourceModule(
  resourceModule: unknown,
  path: string
): "empty" | "missing-default" | "valid" {
  if (typeof resourceModule !== "object" || resourceModule === null) {
    throw createInvalidResourceImplementationError(path);
  }

  const moduleRecord = resourceModule as Record<string, unknown>;
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
    throw createInvalidResourceImplementationError(path);
  }

  return "valid";
}

function toResourceFile(resourceModule: unknown): ResourceFile {
  return resourceModule as ResourceFile;
}

export async function loadResourceModules(
  loaders: Record<string, () => Promise<unknown>>
) {
  const resourceModules = new Map<string, ResourceFile>();
  const skippedResources: ResourceLoadIssue[] = [];

  const results = await Promise.all(
    Object.entries(loaders).map(async ([path, loadResource]) => {
      const resourceModule = await loadResource();
      const classification = classifyResourceModule(resourceModule, path);

      if (classification === "empty") {
        return {
          skipped: true as const,
          issue: createResourceLoadIssue(path),
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
        resourceModule: toResourceFile(resourceModule),
      };
    })
  );

  for (const result of results) {
    if (result.skipped) {
      skippedResources.push(result.issue);
      continue;
    }

    resourceModules.set(result.path, result.resourceModule);
  }

  return {
    resourceModules,
    skippedResources,
  };
}

function createResourceLoadIssueReporter(
  logger: Pick<Console, "warn"> = console
) {
  let lastReportedSummaryKey = "";

  return (skippedResources: ResourceLoadIssue[]) => {
    const summaryKey = skippedResources
      .map(({ path, message }) => `${path}:${message}`)
      .sort()
      .join("|");

    if (summaryKey === lastReportedSummaryKey) {
      return;
    }

    lastReportedSummaryKey = summaryKey;

    if (skippedResources.length === 0) {
      return;
    }

    skippedResources.forEach(({ path, message }) => {
      logger.warn(
        `[xmcp] Failed to load resource file: ${path}\n   -> ${message}`
      );
    });

    const count = skippedResources.length;
    logger.warn(
      `[xmcp] ${count} resource${count === 1 ? "" : "s"} skipped due to empty files or missing default exports`
    );
  };
}

export const reportResourceLoadIssues = createResourceLoadIssueReporter();
