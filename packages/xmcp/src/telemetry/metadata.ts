import isDockerFunction from "is-docker";
import isWslBoolean from "is-wsl";
import os from "os";
import ciEnvironment from "ci-info";

// CI details
const { isCI: _isCI, name: _name } = ciEnvironment;

export type TelemetryMeta = {
  platform: NodeJS.Platform;
  systemRelease: string;
  arch: string;
  cpuCores: number;
  cpuModel: string | null;
  cpuSpeed: number | null;
  memoryTotal: number;
  isDocker: boolean;
  isWsl: boolean;
  isCI: typeof _isCI;
  ciName: typeof _name | null;
};

let traits: TelemetryMeta | undefined;

export function getAnonymousMeta(): TelemetryMeta {
  if (traits) {
    return traits;
  }

  const cpus = os.cpus() || [];
  traits = {
    // Software information
    platform: os.platform(),
    systemRelease: os.release(),
    arch: os.arch(),
    // Machine information
    cpuCores: cpus.length,
    cpuModel: cpus.length ? cpus[0].model : null,
    cpuSpeed: cpus.length ? cpus[0].speed : null,
    memoryTotal: Math.trunc(os.totalmem() / Math.pow(1024, 2)),
    // Environment information
    isDocker: isDockerFunction(),
    isWsl: isWslBoolean,
    isCI: _isCI,
    ciName: (_isCI && _name) || null,
  };

  return traits;
}
