export type ToolModuleValidationReason =
  | "missing_default_export"
  | "invalid_default_export";

export type ToolLoadSkipReason = "missing_or_invalid_export" | "import_error";

export type ToolLoadReport = {
  skippedCount: number;
  missingOrInvalidExportCount: number;
  importErrorCount: number;
  skippedByPath: Record<string, ToolLoadSkipReason>;
};

const toolLoadIssueLogCache = new Set<string>();
const toolLoadSummaryLogCache = new Set<string>();

export function validateToolModule(module: unknown): {
  valid: boolean;
  reason?: ToolModuleValidationReason;
} {
  if (typeof module !== "object" || module === null) {
    return { valid: false, reason: "missing_default_export" };
  }

  if (!("default" in module)) {
    return { valid: false, reason: "missing_default_export" };
  }

  const handler = (module as Record<string, unknown>).default;
  if (typeof handler !== "function") {
    return { valid: false, reason: "invalid_default_export" };
  }

  return { valid: true };
}

function logMalformedToolFile(path: string): void {
  const cacheKey = `${path}:missing_or_invalid_export`;
  if (toolLoadIssueLogCache.has(cacheKey)) {
    return;
  }

  toolLoadIssueLogCache.add(cacheKey);
  console.warn(
    `[xmcp] Failed to load tool file: ${path}\n` +
      "   → File is empty or does not export a valid tool definition."
  );
}

function logToolImportError(path: string, error: unknown): void {
  const cacheKey = `${path}:import_error`;
  if (toolLoadIssueLogCache.has(cacheKey)) {
    return;
  }

  toolLoadIssueLogCache.add(cacheKey);
  console.error(`[xmcp] Failed to load tool file: ${path}`, error);
}

export function logToolLoadSummary(report: ToolLoadReport): void {
  if (report.skippedCount === 0) {
    return;
  }

  const signature = JSON.stringify(report.skippedByPath);
  if (toolLoadSummaryLogCache.has(signature)) {
    return;
  }

  toolLoadSummaryLogCache.add(signature);

  console.warn(
    `[xmcp] ${report.skippedCount} tools skipped due to empty/malformed files or import errors.`
  );
}

export function resetToolLoadingDiagnosticsForTests(): void {
  toolLoadIssueLogCache.clear();
  toolLoadSummaryLogCache.clear();
}

export function loadToolsFromInjected<T = unknown>(
  tools: Record<string, () => Promise<unknown>>
) {
  const toolModules = new Map<string, T>();
  const toolLoadReport: ToolLoadReport = {
    skippedCount: 0,
    missingOrInvalidExportCount: 0,
    importErrorCount: 0,
    skippedByPath: {},
  };

  const toolPromises = Object.keys(tools).map(async (path) => {
    try {
      const toolModule = await tools[path]();
      const validation = validateToolModule(toolModule);

      if (!validation.valid) {
        toolLoadReport.skippedCount += 1;
        toolLoadReport.missingOrInvalidExportCount += 1;
        toolLoadReport.skippedByPath[path] = "missing_or_invalid_export";
        logMalformedToolFile(path);
        return;
      }

      toolModules.set(path, toolModule as T);
    } catch (error) {
      toolLoadReport.skippedCount += 1;
      toolLoadReport.importErrorCount += 1;
      toolLoadReport.skippedByPath[path] = "import_error";
      logToolImportError(path, error);
    }
  });

  return [toolPromises, toolModules, toolLoadReport] as const;
}
