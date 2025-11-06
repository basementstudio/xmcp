import retry from "async-retry";

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

  meta: {
    platform?: string;
    arch?: string;
    systemRelease?: string;
    cpuModel?: string;
    cpuSpeed?: number;
    cpuCores?: number;
    memoryTotal?: number;
    isCI?: boolean;
    ciName?: string | null;
    isDocker?: boolean;
  };

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
export function postTelemetryPayload(
  payload: TelemetryPayload,
  signal?: AbortSignal
): Promise<void> {
  if (!signal && "timeout" in AbortSignal) {
    signal = AbortSignal.timeout(5000);
  }

  return (
    retry(
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
    )
      .catch((error) => {
        // swallow errors in production - telemetry should never break the build
      })
      // Ensure promise is voided (fire and forget)
      .then(
        () => {},
        () => {}
      )
  );
}

/**
 * Helper to create payload from metadata and events
 */
export function createPayload(
  context: TelemetryPayload["context"],
  meta: Record<string, any>,
  events: TelemetryPayload["events"]
): TelemetryPayload {
  return { context, meta, events };
}
