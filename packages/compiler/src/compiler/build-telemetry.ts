import {
  AdapterType,
  ErrorPhase,
  TelemetryEventName,
  TransportType,
  telemetry,
} from "../telemetry";
import type { BuildEventData } from "../telemetry/events/post-payload";
import { isTelemetryDebugEnabled } from "../telemetry/debug";
import type { DeployTarget, PackageManager } from "./telemetry-traits";

type TelemetryClient = Pick<typeof telemetry, "record" | "flushDetached">;

interface BaseTelemetryData {
  duration: number;
  toolsCount: number;
  reactToolsCount: number;
  promptsCount: number;
  resourcesCount: number;
  transport?: TransportType;
  adapter?: AdapterType;
  nodeVersion: string;
  xmcpVersion: string;
  command: CompilerCommand;
  packageManager: PackageManager;
  deployTarget: DeployTarget;
  features?: string[];
}

export type CompilerCommand = "build" | "dev";

export interface BuildSuccessTelemetry extends BaseTelemetryData {
  outputSize: number;
}

export type ErrorType = string & { readonly __sanitizedErrorType: true };

export interface BuildFailureTelemetry extends BaseTelemetryData {
  errorPhase: ErrorPhase;
  errorType: ErrorType;
}

const ERROR_TYPE_PATTERN = /^[A-Za-z][A-Za-z0-9_]{0,63}$/;
const FALLBACK_ERROR_TYPE = "WebpackError";
const MODULE_NOT_FOUND_ERROR_TYPE = "ModuleNotFoundError";

export function toErrorType(...candidates: unknown[]): ErrorType {
  const errorType = candidates.find(
    (candidate): candidate is string =>
      typeof candidate === "string" && ERROR_TYPE_PATTERN.test(candidate)
  );
  return (errorType ?? FALLBACK_ERROR_TYPE) as ErrorType;
}

export function toBundlerErrorType(bundlerError?: {
  code?: unknown;
  name?: unknown;
  message?: unknown;
}): ErrorType {
  const isModuleNotFound =
    typeof bundlerError?.message === "string" &&
    bundlerError.message.includes("Module not found");

  return toErrorType(
    bundlerError?.code,
    bundlerError?.name,
    isModuleNotFound ? MODULE_NOT_FOUND_ERROR_TYPE : undefined
  );
}

function enqueueTelemetryEvent(
  client: TelemetryClient,
  event: { eventName: TelemetryEventName; fields: BuildEventData }
) {
  if (isTelemetryDebugEnabled()) {
    console.log("[telemetry] Tracking event", event);
  }
  client.record(event, true);
  client.flushDetached(event.fields.command === "dev" ? "dev" : "build");
}

export function logBuildSuccess(
  data: BuildSuccessTelemetry,
  client: TelemetryClient = telemetry
) {
  enqueueTelemetryEvent(client, {
    eventName: TelemetryEventName.BUILD_COMPLETED,
    fields: { success: true, ...data },
  });
}

export function logBuildFailure(
  data: BuildFailureTelemetry,
  client: TelemetryClient = telemetry
) {
  enqueueTelemetryEvent(client, {
    eventName: TelemetryEventName.BUILD_FAILED,
    fields: { success: false, ...data },
  });
}

export function logDevStarted(
  data: BaseTelemetryData,
  client: TelemetryClient = telemetry
) {
  enqueueTelemetryEvent(client, {
    eventName: TelemetryEventName.DEV_STARTED,
    fields: { success: true, ...data },
  });
}
