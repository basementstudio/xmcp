const TELEMETRY_DEBUG_ENV = "XMCP_DEBUG_TELEMETRY";

export function isTelemetryDebugEnabled(): boolean {
  const envValue = process.env?.[
    TELEMETRY_DEBUG_ENV as keyof NodeJS.ProcessEnv
  ] as string | undefined;
  return typeof envValue === "string" && envValue.toLowerCase() === "true";
}
