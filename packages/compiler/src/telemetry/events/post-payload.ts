import retry from "async-retry";
import type { TelemetryMeta } from "../metadata";
import { isTelemetryDebugEnabled } from "../debug";

/**
 * Build event data (only event type we track)
 */
export interface BuildEventData {
  success: boolean;
  duration: number;
  toolsCount: number;
  reactToolsCount: number;
  promptsCount: number;
  resourcesCount: number;
  outputSize?: number;
  transport: string;
  adapter: string;
  nodeVersion?: string;
  xmcpVersion?: string;
  errorPhase?: string;
  errorType?: string;
}

/**
 * Telemetry payload structure
 */
export interface TelemetryPayload {
  context: {
    anonymousId: string;
    projectHash: string;
    sessionId: string;
  };

  meta: TelemetryMeta;

  events: Array<{
    eventName: string;
    timestamp: string;
    fields: BuildEventData;
  }>;
}

/**
 * Post telemetry payload to the endpoint
 *
 * Features:
 * - Automatic retry with exponential backoff using async-retry
 * - Timeout handling (5s default)
 * - Error swallowing (never breaks the build)
 * - Voided promise (fire and forget)
 *
 * @param payload - The telemetry payload
 * @param signal - Optional AbortSignal for timeout control
 * @returns Voided promise
 */
export interface PostTelemetryOptions {
  signal?: AbortSignal;
  /**
   * When true (default) errors are swallowed to avoid interrupting builds.
   * Set to false when the caller needs to know if the request failed.
   */
  swallowErrors?: boolean;
}

function debugLogTelemetryPayload(payload: TelemetryPayload) {
  if (!isTelemetryDebugEnabled()) {
    return;
  }
  try {
    console.log(
      "[telemetry] Sending payload",
      JSON.stringify(payload, null, 2)
    );
  } catch (_) {
    console.log("[telemetry] Sending payload (unable to stringify)");
  }
}

export async function postTelemetryPayload(
  payload: TelemetryPayload,
  options?: PostTelemetryOptions
): Promise<void> {
  let signal = options?.signal;
  const swallowErrors = options?.swallowErrors ?? true;

  if (!signal && "timeout" in AbortSignal) {
    signal = AbortSignal.timeout(5000);
  }

  try {
    debugLogTelemetryPayload(payload);
    await retry(
      async () => {
        const response = await fetch(
          "https://telemetry.xmcp.dev/api/telemetry/events",
          {
            method: "POST",
            body: JSON.stringify(payload),
            headers: { "content-type": "application/json" },
            signal,
          }
        );

        // Try to parse response body
        const responseText = await response.text();
        let responseData;
        try {
          responseData = JSON.parse(responseText);
        } catch (e) {
          // response might not be json
          // ignore
        }

        if (!response.ok) {
          const err = new Error(
            `HTTP ${response.status}: ${response.statusText}`
          );
          (err as any).response = response;
          (err as any).responseData = responseData;
          throw err;
        }
      },
      { minTimeout: 500, retries: 1, factor: 1 }
    );
  } catch (error) {
    if (!swallowErrors) {
      throw error;
    }
  }
}

/**
 * Helper to create payload from metadata and events
 */
export function createPayload(
  context: TelemetryPayload["context"],
  meta: TelemetryMeta,
  events: TelemetryPayload["events"]
): TelemetryPayload {
  return { context, meta, events };
}
