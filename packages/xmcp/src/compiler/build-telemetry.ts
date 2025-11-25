import {
  AdapterType,
  ErrorPhase,
  TelemetryEventName,
  TransportType,
  telemetry,
} from "../telemetry";
import type { BuildEventData } from "../telemetry/events/post-payload";
import { isTelemetryDebugEnabled } from "../telemetry/debug";

type TelemetryClient = Pick<typeof telemetry, "record" | "flushDetached">;

interface BaseTelemetryData {
  duration: number;
  toolsCount: number;
  reactToolsCount: number;
  promptsCount: number;
  resourcesCount: number;
  transport: TransportType;
  adapter: AdapterType;
  nodeVersion: string;
  xmcpVersion: string;
}

export interface BuildSuccessTelemetry extends BaseTelemetryData {
  outputSize: number;
}

export interface BuildFailureTelemetry extends BaseTelemetryData {
  errorPhase: ErrorPhase;
  errorType: string;
}

function enqueueTelemetryEvent(
  client: TelemetryClient,
  event: { eventName: TelemetryEventName; fields: BuildEventData }
) {
  if (isTelemetryDebugEnabled()) {
    console.log("[telemetry] Tracking event", event);
  }
  client.record(event, true);
  client.flushDetached("build");
}

export function logBuildSuccess(
  data: BuildSuccessTelemetry,
  client: TelemetryClient = telemetry
) {
  enqueueTelemetryEvent(client, {
    eventName: TelemetryEventName.BUILD_COMPLETED,
    fields: {
      success: true,
      duration: data.duration,
      toolsCount: data.toolsCount,
      reactToolsCount: data.reactToolsCount,
      promptsCount: data.promptsCount,
      resourcesCount: data.resourcesCount,
      outputSize: data.outputSize,
      transport: data.transport,
      adapter: data.adapter,
      nodeVersion: data.nodeVersion,
      xmcpVersion: data.xmcpVersion,
    },
  });
}

export function logBuildFailure(
  data: BuildFailureTelemetry,
  client: TelemetryClient = telemetry
) {
  enqueueTelemetryEvent(client, {
    eventName: TelemetryEventName.BUILD_FAILED,
    fields: {
      success: false,
      duration: data.duration,
      errorPhase: data.errorPhase,
      errorType: data.errorType,
      toolsCount: data.toolsCount,
      reactToolsCount: data.reactToolsCount,
      promptsCount: data.promptsCount,
      resourcesCount: data.resourcesCount,
      transport: data.transport,
      adapter: data.adapter,
      nodeVersion: data.nodeVersion,
      xmcpVersion: data.xmcpVersion,
    },
  });
}
