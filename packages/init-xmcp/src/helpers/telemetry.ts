import { createHash, randomBytes } from "crypto";
import fs from "fs";
import os from "os";
import path from "path";

const TELEMETRY_ENDPOINT = "https://telemetry.xmcp.dev/api/telemetry/events";
const SEND_TIMEOUT_MS = 2000;
const ERROR_TYPE_PATTERN = /^[A-Za-z][A-Za-z0-9_]{0,63}$/;

const KEY_ENABLED = "telemetry.enabled";
const KEY_NOTIFIED_AT = "telemetry.notifiedAt";
const KEY_ANONYMOUS_ID = "telemetry.anonymousId";
const KEY_SALT = "telemetry.salt";

const PACKAGE_MANAGERS = ["npm", "pnpm", "yarn", "bun"];

type Preferences = Record<string, string | boolean | undefined>;

export type ScaffoldReport = {
  command: "create-xmcp-app" | "init-xmcp";
  version: string;
  projectName: string;
  packageManager?: string;
  features: string[];
  duration: number;
  template?: string;
  framework?: string;
  error?: unknown;
};

const isCI = !!process.env.CI && process.env.CI !== "false";
const isDocker = fs.existsSync("/.dockerenv");
const isWsl =
  process.platform === "linux" &&
  os.release().toLowerCase().includes("microsoft");

function isDisabledByEnv(): boolean {
  return process.env.XMCP_TELEMETRY_DISABLED?.toLowerCase() === "true";
}

const EPHEMERAL_PREFERENCES_PATH = path.join(
  os.tmpdir(),
  ".xmcp-cache",
  "telemetry.json"
);

const USER_PREFERENCES_PATH = path.join(
  os.homedir(),
  process.platform === "win32" ? "AppData/Local/xmcp" : ".config/xmcp",
  "telemetry.json"
);

function isDisabledByPreferences(): boolean {
  return [EPHEMERAL_PREFERENCES_PATH, USER_PREFERENCES_PATH].some(
    (filePath) => readPreferences(filePath)[KEY_ENABLED] === false
  );
}

export function readProjectName(projectRoot: string): string {
  try {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(projectRoot, "package.json"), "utf-8")
    );
    return packageJson.name || path.basename(projectRoot);
  } catch {
    return path.basename(projectRoot);
  }
}

function readPreferences(filePath: string): Preferences {
  return fs.existsSync(filePath)
    ? JSON.parse(fs.readFileSync(filePath, "utf-8"))
    : {};
}

function showNotice(): void {
  console.log("");
  console.log("xmcp collects anonymous usage data to improve the framework.");
  console.log("   No personal information is collected.");
  console.log(
    "   You can learn more and opt-out by visiting: https://xmcp.dev/telemetry"
  );
  console.log("   Or disable with: XMCP_TELEMETRY_DISABLED=true");
  console.log("");
}

function toErrorType(error: unknown): string {
  const name = error instanceof Error ? error.constructor.name : "";
  return ERROR_TYPE_PATTERN.test(name) ? name : "Error";
}

function buildPayload(report: ScaffoldReport, preferences: Preferences) {
  const cpus = os.cpus() ?? [];
  const failed = report.error !== undefined;

  return {
    context: {
      anonymousId: preferences[KEY_ANONYMOUS_ID],
      sessionId: randomBytes(32).toString("hex"),
      projectHash: createHash("sha256")
        .update(String(preferences[KEY_SALT]))
        .update(report.projectName)
        .digest("hex"),
    },
    meta: {
      platform: os.platform(),
      systemRelease: os.release(),
      arch: os.arch(),
      cpuCores: cpus.length,
      cpuModel: cpus.length ? cpus[0].model : null,
      cpuSpeed: cpus.length ? cpus[0].speed : null,
      memoryTotal: Math.trunc(os.totalmem() / Math.pow(1024, 2)),
      isDocker,
      isWsl,
      isCI,
      ciName: null,
    },
    events: [
      {
        eventName: failed ? "scaffold:failed" : "scaffold:completed",
        timestamp: new Date().toISOString(),
        fields: {
          success: !failed,
          duration: report.duration,
          command: report.command,
          packageManager: PACKAGE_MANAGERS.includes(report.packageManager ?? "")
            ? report.packageManager
            : "unknown",
          features: report.features,
          template: report.template,
          framework: report.framework,
          nodeVersion: process.version,
          xmcpVersion: report.version,
          ...(failed
            ? { errorPhase: "scaffold", errorType: toErrorType(report.error) }
            : {}),
        },
      },
    ],
  };
}

export async function reportScaffold(report: ScaffoldReport): Promise<void> {
  if (isDisabledByEnv()) {
    return;
  }

  try {
    if (isDisabledByPreferences()) {
      return;
    }

    const filePath =
      isCI || isDocker ? EPHEMERAL_PREFERENCES_PATH : USER_PREFERENCES_PATH;
    const preferences = readPreferences(filePath);

    if (!preferences[KEY_NOTIFIED_AT]) {
      preferences[KEY_NOTIFIED_AT] = Date.now().toString();
      if (!isCI) {
        showNotice();
      }
    }
    preferences[KEY_ANONYMOUS_ID] ??= randomBytes(32).toString("hex");
    preferences[KEY_SALT] ??= randomBytes(16).toString("hex");

    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(preferences, null, 2), "utf-8");

    await fetch(TELEMETRY_ENDPOINT, {
      method: "POST",
      body: JSON.stringify(buildPayload(report, preferences)),
      headers: { "content-type": "application/json" },
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    });
  } catch {
    return;
  }
}
