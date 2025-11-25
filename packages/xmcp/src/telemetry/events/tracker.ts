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
import { isTelemetryDebugEnabled } from "../debug";

export type TelemetryEvent = {
  eventName: string;
  fields: BuildEventData;
  timestamp?: string;
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

  constructor(distDir: string = ".xmcp") {
    this.storage = new TelemetryStorage();
    this.sessionId = randomBytes(32).toString("hex");
    this.queue = new Set();
    this.distDir = distDir;

    if (isTelemetryDebugEnabled()) {
      const enabled = this.storage.isEnabled;
      console.log(
        `[telemetry] Telemetry is ${enabled ? "enabled" : "disabled"}`
      );
      if (enabled) {
        console.log(`[telemetry] Anonymous ID ${this.storage.anonymousId}`);
      } else if (process.env.XMCP_TELEMETRY_DISABLED) {
        console.log(
          "[telemetry] Disabled via XMCP_TELEMETRY_DISABLED environment variable"
        );
      }
    }
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
    const eventsWithTimestamps = (
      Array.isArray(_events) ? _events : [_events]
    ).map((event) => ({
      ...event,
      timestamp: event.timestamp ?? new Date().toISOString(),
    }));

    const normalizedEvents = Array.isArray(_events)
      ? eventsWithTimestamps
      : eventsWithTimestamps[0];

    const prom = (
      deferred
        ? // if we know we are going to immediately call
          // flushDetached we can skip starting the initial
          // submitRecord which will then be cancelled
          new Promise((resolve) =>
            resolve({
              isFulfilled: true,
              isRejected: false,
              value: normalizedEvents,
            })
          )
        : this.submitRecord(normalizedEvents)
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

    (prom as any)._events = eventsWithTimestamps;

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
        timestamp: event.timestamp ?? new Date().toISOString(),
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

    // Skip if no events to send
    if (allEvents.length === 0) {
      return;
    }

    try {
      mkdirSync(this.distDir, { recursive: true });
      const eventsFilePath = path.join(this.distDir, "_events.json");
      // Save both events and sessionId to preserve session across processes
      writeFileSync(
        eventsFilePath,
        JSON.stringify({
          sessionId: this.sessionId,
          events: allEvents,
        })
      );

      // Note: cross-spawn is not used here as it causes
      // a new command window to appear when we don't want it to
      const child_process =
        require("child_process") as typeof import("child_process");

      // we use spawnSync when debugging to ensure logs are piped
      // correctly to stdout/stderr
      const spawn = child_process.spawn;

      // Resolve the detached-flush script path
      // After webpack compilation, detached-flush.js is in the dist root
      // We need to go up from wherever this compiled file is to find it
      // This file will be bundled into index.js, so __dirname will be dist/
      const detachedFlushPath = path.join(__dirname, "detached-flush.js");

      const result = spawn(
        process.execPath,
        [detachedFlushPath, mode, this.distDir],
        {
          detached: true,
          windowsHide: true,
          shell: false,
        }
      );

      // Unref the child process so it doesn't keep the parent alive
      if ("unref" in result && result.unref) {
        result.unref();
      }

      this.queue.clear();
    } catch (error) {
      // Silently fail - telemetry should never break the build
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

export function getTelemetry(): TelemetryTracker {
  if (!telemetryInstance) {
    telemetryInstance = new TelemetryTracker();
  }
  return telemetryInstance;
}

export const telemetry = getTelemetry();
