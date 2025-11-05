/**
 * XMCP TELEMETRY SYSTEM
 *
 * Privacy-First Anonymous Usage Tracking
 * =======================================
 *
 * PURPOSE:
 * This telemetry system helps us understand how xmcp is used in the wild,
 * enabling data-driven decisions to improve the framework while respecting
 * user privacy.
 *
 * PRIVACY PRINCIPLES:
 * 1. Anonymous by default - No personal information ever collected
 * 2. No IP addresses stored - We don't track where requests come from
 * 3. No source code - We never collect file contents or sensitive data
 * 4. Hashed identifiers - Project paths are hashed for privacy
 * 5. Transparent - Users see what's collected on first run
 * 6. Easy opt-out - Set XMCP_TELEMETRY_DISABLED=1
 *
 * WHAT WE COLLECT:
 * • Build success/failure events with duration
 * • Tool, prompt, and resource counts
 * • Transport type (HTTP/stdio) and adapter (Express/Next.js)
 * • Whether React components are used
 * • System metadata: OS, architecture, CPU, Node.js version
 * • Anonymous IDs: user (persistent), session (ephemeral), project (hashed path)
 *
 * WHAT WE DON'T COLLECT:
 * • Personal information (names, emails, etc.)
 * • IP addresses
 * • Source code or file contents
 * • Environment variables
 * • Actual file paths
 * • Any data that could identify a user or organization
 *
 * TECHNICAL IMPLEMENTATION:
 * • Non-blocking: Events sent in background, never delay builds
 * • Offline resilient: Failed events queued to disk and retried later
 * • Queue limits: Max 50 events stored to prevent disk space issues
 * • Timeout: 5s max per request, then queue for retry
 * • CI detection: Automatic detection of CI/Docker environments
 *
 * DATA STORAGE:
 * • Config: ~/.config/xmcp/telemetry.json (or AppData on Windows)
 * • Queue: ~/.config/xmcp/telemetry-queue.json
 * • CI/Docker: Uses temp directory (non-persistent)
 *
 * COMPLIANCE:
 * • GDPR compliant - No personal data, clear opt-out
 * • No cookies or tracking across sites
 * • Data minimization - Only essential metrics
 * • Purpose limitation - Data used only for improving xmcp
 */

import { randomBytes } from "crypto";
import { writeFileSync, mkdirSync } from "fs";
import path from "path";
import { TelemetryStorage } from "../storage";
import { getAnonymousMeta } from "../metadata";
import {
  postTelemetryPayload,
  createPayload,
  BuildEventData,
} from "./post-payload";
import { getProjectId } from "../project-id";

export type TelemetryEvent = {
  eventName: string;
  fields: BuildEventData;
};

type RecordObject = {
  isFulfilled: boolean;
  isRejected: boolean;
  value?: any;
  reason?: any;
};

export class TelemetryTracker {
  private storage: TelemetryStorage;
  private sessionId: string;
  private queue: Set<Promise<RecordObject>>;
  private loadProjectId: undefined | string | Promise<string>;
  private distDir: string;
  private XMCP_TELEMETRY_DEBUG: string | undefined;

  constructor(distDir: string = ".xmcp") {
    this.storage = new TelemetryStorage();
    this.sessionId = randomBytes(32).toString("hex");
    this.queue = new Set();
    this.distDir = distDir;
    this.XMCP_TELEMETRY_DEBUG = "1"; // TODO: change back to process.env.XMCP_TELEMETRY_DEBUG;
  }

  get anonymousId(): string {
    return this.storage.anonymousId;
  }

  get isDisabled(): boolean {
    return this.storage.isDisabled;
  }

  get isEnabled(): boolean {
    return this.storage.isEnabled;
  }

  setEnabled(enabled: boolean): string | undefined {
    return this.storage.setEnabled(enabled);
  }

  private async getProjectId(): Promise<string> {
    this.loadProjectId =
      this.loadProjectId ||
      getProjectId(this.storage.oneWayHash.bind(this.storage));
    return await this.loadProjectId;
  }

  /**
   * Record telemetry events
   * Returns a promise that resolves to a RecordObject
   */
  record(
    _events: TelemetryEvent | TelemetryEvent[],
    deferred?: boolean
  ): Promise<RecordObject> {
    const prom = (
      deferred
        ? // if we know we are going to immediately call
          // flushDetached we can skip starting the initial
          // submitRecord which will then be cancelled
          new Promise((resolve) =>
            resolve({
              isFulfilled: true,
              isRejected: false,
              value: _events,
            })
          )
        : this.submitRecord(_events)
    )
      .then((value) => ({
        isFulfilled: true,
        isRejected: false,
        value,
      }))
      .catch((reason) => ({
        isFulfilled: false,
        isRejected: true,
        reason,
      }))
      // Acts as `Promise#finally` because `catch` transforms the error
      .then((res) => {
        // Clean up the event to prevent unbounded `Set` growth
        if (!deferred) {
          this.queue.delete(prom);
        }
        return res;
      });

    (prom as any)._events = Array.isArray(_events) ? _events : [_events];

    // Track this `Promise` so we can flush pending events
    this.queue.add(prom);

    return prom;
  }

  private async submitRecord(
    _events: TelemetryEvent | TelemetryEvent[]
  ): Promise<any> {
    let events: TelemetryEvent[];
    if (Array.isArray(_events)) {
      events = _events;
    } else {
      events = [_events];
    }

    if (events.length < 1) {
      return Promise.resolve();
    }

    if (this.XMCP_TELEMETRY_DEBUG) {
      // Print to standard error to simplify selecting the output
      events.forEach(({ eventName, fields }) =>
        console.error(
          `[telemetry] ` + JSON.stringify({ eventName, fields }, null, 2)
        )
      );
      // Do not send the telemetry data if debugging. Users may use this feature
      // to preview what data would be sent.
      return Promise.resolve();
    }

    // Skip recording telemetry if the feature is disabled
    if (this.isDisabled) {
      return Promise.resolve();
    }

    const meta = getAnonymousMeta();

    const payload = createPayload(
      {
        anonymousId: this.storage.anonymousId,
        projectHash: await this.getProjectId(),
        sessionId: this.sessionId,
      },
      meta,
      events.map((event) => ({
        eventName: event.eventName,
        timestamp: new Date().toISOString(),
        fields: event.fields,
      }))
    );

    return await postTelemetryPayload(payload);
  }

  /**
   * Flush all pending telemetry events
   */
  async flush(): Promise<void> {
    await Promise.all(this.queue).catch(() => null);
  }

  /**
   * Writes current events to disk and spawns separate
   * detached process to submit the records without blocking
   * the main process from exiting
   */
  flushDetached(mode: "dev" | "build"): void {
    const allEvents: TelemetryEvent[] = [];

    this.queue.forEach((item: any) => {
      try {
        allEvents.push(...item._events);
      } catch (_) {
        // if we fail to collect events, ignore
      }
    });

    if (this.XMCP_TELEMETRY_DEBUG) {
      console.error(
        "[telemetry] flushDetached called with",
        allEvents.length,
        "events"
      );
    }

    // Skip if no events to send
    if (allEvents.length === 0) {
      return;
    }

    try {
      mkdirSync(this.distDir, { recursive: true });
      const eventsFilePath = path.join(this.distDir, "_events.json");
      writeFileSync(eventsFilePath, JSON.stringify(allEvents));

      if (this.XMCP_TELEMETRY_DEBUG) {
        console.error("[telemetry] Wrote events to", eventsFilePath);
      }

      // Note: cross-spawn is not used here as it causes
      // a new command window to appear when we don't want it to
      const child_process =
        require("child_process") as typeof import("child_process");

      // we use spawnSync when debugging to ensure logs are piped
      // correctly to stdout/stderr
      const spawn = this.XMCP_TELEMETRY_DEBUG
        ? child_process.spawnSync
        : child_process.spawn;

      // Resolve the detached-flush script path
      // After webpack compilation, detached-flush.js is in the dist root
      // We need to go up from wherever this compiled file is to find it
      // This file will be bundled into index.js, so __dirname will be dist/
      const detachedFlushPath = path.join(__dirname, "detached-flush.js");

      if (this.XMCP_TELEMETRY_DEBUG) {
        console.error(
          "[telemetry] Spawning detached process:",
          detachedFlushPath
        );
      }

      const result = spawn(
        process.execPath,
        [detachedFlushPath, mode, this.distDir],
        {
          detached: !this.XMCP_TELEMETRY_DEBUG,
          windowsHide: true,
          shell: false,
          ...(this.XMCP_TELEMETRY_DEBUG
            ? {
                stdio: "inherit",
              }
            : {}),
        }
      );

      if (this.XMCP_TELEMETRY_DEBUG && "error" in result && result.error) {
        console.error("[telemetry] Spawn error:", result.error);
      }

      // Unref the child process so it doesn't keep the parent alive
      if (!this.XMCP_TELEMETRY_DEBUG && "unref" in result && result.unref) {
        result.unref();
      }
    } catch (error) {
      // Silently fail - telemetry should never break the build
      if (this.XMCP_TELEMETRY_DEBUG) {
        console.error("[telemetry] flushDetached error:", error);
      }
    }
  }

  // For testing purposes
  getStorage(): TelemetryStorage {
    return this.storage;
  }

  getSessionId(): string {
    return this.sessionId;
  }

  getQueueSize(): number {
    return this.queue.size;
  }
}

// Singleton instance
let telemetryInstance: TelemetryTracker | null = null;

export function getTelemetry(distDir?: string): TelemetryTracker {
  if (!telemetryInstance) {
    telemetryInstance = new TelemetryTracker(distDir);
  }
  return telemetryInstance;
}

// Export singleton instance (will be initialized on first use)
export const telemetry = getTelemetry();
