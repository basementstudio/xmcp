import { telemetry } from "../../../telemetry";

export const TELEMETRY_ACTIONS = ["status", "enable", "disable"] as const;

export type TelemetryAction = (typeof TELEMETRY_ACTIONS)[number];

export function isTelemetryAction(value: string): value is TelemetryAction {
  return TELEMETRY_ACTIONS.includes(value as TelemetryAction);
}

export function runTelemetry(action: TelemetryAction): string[] {
  if (action !== "status") {
    telemetry.setEnabled(action === "enable");
  }

  const lines = [
    `Telemetry is ${telemetry.isEnabled ? "enabled" : "disabled"}.`,
    `Preference file: ${telemetry.configFilePath}`,
  ];

  if (telemetry.isDisabledByEnv) {
    lines.push("XMCP_TELEMETRY_DISABLED=true is set and overrides this file.");
  }

  return lines;
}
