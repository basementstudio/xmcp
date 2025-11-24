#!/usr/bin/env node
/**
 * Detached flush script
 */

import { readFileSync, unlinkSync, existsSync } from "fs";
import path from "path";
import { TelemetryStorage } from "../storage";
import { getAnonymousMeta } from "../metadata";
import { postTelemetryPayload, createPayload } from "./post-payload";
import { getProjectId } from "../project-id";
import type { TelemetryEvent } from "./tracker";

async function main() {
  const [mode, distDir] = process.argv.slice(2);

  if (!mode || !distDir) {
    console.error("Usage: detached-flush <mode> <distDir>");
    process.exit(1);
  }

  const eventsFile = path.join(distDir, "_events.json");

  if (!existsSync(eventsFile)) {
    return;
  }

  try {
    // Read events from disk
    const eventsData = readFileSync(eventsFile, "utf-8");
    const {
      sessionId,
      events,
    }: { sessionId: string; events: TelemetryEvent[] } = JSON.parse(eventsData);

    if (events.length === 0) {
      return;
    }

    // Initialize storage
    const storage = new TelemetryStorage();

    // Skip if telemetry is disabled
    if (storage.isDisabled) {
      return;
    }

    // Get project ID with one-way hash
    const projectId = await getProjectId(storage.oneWayHash.bind(storage));

    // Create payload using the preserved session ID
    const meta = getAnonymousMeta();

    const payload = createPayload(
      {
        anonymousId: storage.anonymousId,
        projectHash: projectId,
        sessionId,
      },
      meta,
      events.map((event) => ({
        eventName: event.eventName,
        timestamp: new Date().toISOString(),
        fields: event.fields,
      }))
    );

    await postTelemetryPayload(payload, { swallowErrors: false });

    // Clean up events file after successful send
    unlinkSync(eventsFile);
  } catch (error) {
    // Silently fail in production - don't want to spam users with errors
    // If we fail, the events file will remain and might be picked up next time
  }
}

main();
