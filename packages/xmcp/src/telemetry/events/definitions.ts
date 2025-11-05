/**
 * Telemetry Event Definitions
 *
 * Simple, privacy-focused telemetry for xmcp builds
 */

export enum TelemetryEventName {
  BUILD_COMPLETED = "build:completed",
  BUILD_FAILED = "build:failed",
}

export enum TransportType {
  HTTP = "http",
  STDIO = "stdio",
}

export enum ErrorPhase {
  CONFIG = "config",
  COMPILE = "compile",
  WEBPACK = "webpack",
  TRANSPILE = "transpile",
}

export enum AdapterType {
  NONE = "none",
  EXPRESS = "express",
  NEXTJS = "nextjs",
}

type EventPayload = {
  success: boolean;
  duration: number; // milliseconds
  toolsCount: number;
  reactToolsCount: number;
  promptsCount: number;
  resourcesCount: number;
  transport: TransportType;
  adapter: AdapterType;
  nodeVersion: string;
  xmcpVersion: string;
};

export type BuildCompletedPayload = EventPayload & {
  outputSize: number; // bytes
};

export type BuildFailedPayload = EventPayload & {
  errorPhase: ErrorPhase;
  errorType: string;
};

export type TelemetryEventPayload = BuildCompletedPayload | BuildFailedPayload;
