import path from "path";
import fs from "fs";

export type WatchEventScope = "tool" | "prompt" | "resource" | "middleware";
export type WatchEventKind = "add" | "change" | "unlink";

export interface WatchEvent {
  scope: WatchEventScope;
  kind: WatchEventKind;
  filePath?: string;
}

function normalizeSlashes(value: string): string {
  return value.replace(/\\/g, "/");
}

function stripLeadingDotSlash(value: string): string {
  return value.replace(/^\.\//, "");
}

export function toProjectRelativePath(
  filePath: string,
  cwd: string = process.cwd()
): string {
  const relativePath = path.isAbsolute(filePath)
    ? path.relative(cwd, filePath)
    : filePath;

  return stripLeadingDotSlash(normalizeSlashes(relativePath));
}

export function addWatchedPath(
  pathSet: Set<string>,
  filePath: string,
  cwd: string = process.cwd()
) {
  pathSet.add(toProjectRelativePath(filePath, cwd));
}

export function removeWatchedPath(
  pathSet: Set<string>,
  filePath: string,
  cwd: string = process.cwd()
) {
  const normalizedRawPath = stripLeadingDotSlash(normalizeSlashes(filePath));
  const normalizedRelativePath = toProjectRelativePath(filePath, cwd);

  const normalizedCandidates = new Set<string>([
    normalizedRawPath,
    normalizedRelativePath,
  ]);

  for (const currentPath of Array.from(pathSet)) {
    const normalizedCurrentPath = stripLeadingDotSlash(
      normalizeSlashes(currentPath)
    );

    if (normalizedCandidates.has(normalizedCurrentPath)) {
      pathSet.delete(currentPath);
    }
  }
}

export function pruneMissingWatchedPaths(
  pathSet: Set<string>,
  cwd: string = process.cwd()
): boolean {
  let removed = false;

  for (const currentPath of Array.from(pathSet)) {
    const normalized = stripLeadingDotSlash(normalizeSlashes(currentPath));
    const absolutePath = path.resolve(cwd, normalized);

    if (!fs.existsSync(absolutePath)) {
      pathSet.delete(currentPath);
      removed = true;
    }
  }

  return removed;
}

export interface RegenerationQueue {
  schedule: (event: WatchEvent) => void;
  waitForIdle: () => Promise<void>;
}

export function createRegenerationQueue(
  run: (event: WatchEvent) => Promise<void>
): RegenerationQueue {
  let latestEvent: WatchEvent | null = null;
  let isRunning = false;
  const idleResolvers: Array<() => void> = [];

  const resolveIdle = () => {
    if (isRunning || latestEvent) {
      return;
    }

    while (idleResolvers.length > 0) {
      idleResolvers.shift()?.();
    }
  };

  const drain = async () => {
    if (isRunning) {
      return;
    }

    isRunning = true;
    try {
      while (latestEvent) {
        const event = latestEvent;
        latestEvent = null;
        await run(event);
      }
    } finally {
      isRunning = false;
      resolveIdle();
    }
  };

  return {
    schedule(event: WatchEvent) {
      latestEvent = event;
      void drain();
    },
    waitForIdle() {
      if (!isRunning && !latestEvent) {
        return Promise.resolve();
      }

      return new Promise<void>((resolve) => {
        idleResolvers.push(resolve);
      });
    },
  };
}
