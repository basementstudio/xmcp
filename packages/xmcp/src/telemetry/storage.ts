import { randomBytes, createHash, BinaryLike } from "crypto";
import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  unlinkSync,
} from "fs";
import path from "path";
import os from "os";
import isDockerFunction from "is-docker";
import { isCI } from "./ci-info";

// This is the key that stores whether or not telemetry is enabled or disabled.
const TELEMETRY_KEY_ENABLED = "telemetry.enabled";

// This is the key that specifies when the user was informed about anonymous
// telemetry collection.
const TELEMETRY_KEY_NOTIFY_DATE = "telemetry.notifiedAt";

// This is a quasi-persistent identifier used to dedupe recurring events. It's
// generated from random data and completely anonymous.
const TELEMETRY_KEY_ID = "telemetry.anonymousId";

// This is the cryptographic salt that is included within every hashed value.
// This salt value is never sent to us, ensuring privacy and the one-way nature
// of the hash (prevents dictionary lookups of pre-computed hashes).
// See the `oneWayHash` function.
const TELEMETRY_KEY_SALT = "telemetry.salt";

function getConfigPath(): string {
  const isEphemeral = isCI || isDockerFunction();

  if (isEphemeral) {
    // Store in temp directory for CI/Docker (won't persist)
    return path.join(os.tmpdir(), ".xmcp-cache", "telemetry.json");
  }

  // Use system config directory
  const configDir = path.join(
    os.homedir(),
    process.platform === "win32" ? "AppData/Local/xmcp" : ".config/xmcp"
  );

  return path.join(configDir, "telemetry.json");
}

interface TelemetryConfig {
  [TELEMETRY_KEY_ENABLED]?: boolean;
  [TELEMETRY_KEY_NOTIFY_DATE]?: string;
  [TELEMETRY_KEY_ID]?: string;
  [TELEMETRY_KEY_SALT]?: string;
}

export class TelemetryStorage {
  private configPath: string;
  private config: TelemetryConfig | null = null;
  private XMCP_TELEMETRY_DISABLED: string | undefined;

  constructor() {
    this.configPath = getConfigPath();
    this.XMCP_TELEMETRY_DISABLED = process.env.XMCP_TELEMETRY_DISABLED;
    this.ensureConfig();
  }

  private isEnvTelemetryDisabled(): boolean {
    const value = this.XMCP_TELEMETRY_DISABLED;
    return typeof value === "string" && value.toLowerCase() === "true";
  }

  private ensureConfig(): void {
    try {
      // Ensure directory exists
      const dir = path.dirname(this.configPath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }

      // Read existing config
      if (existsSync(this.configPath)) {
        const data = readFileSync(this.configPath, "utf-8");
        this.config = JSON.parse(data);
      } else {
        this.config = {};
      }
    } catch (error) {
      // If we can't read/write, use empty config
      this.config = {};
    }
  }

  private get<T>(key: string, defaultValue?: T): T | undefined {
    if (!this.config) {
      return defaultValue;
    }
    const val = this.config[key as keyof TelemetryConfig];
    return val !== undefined ? (val as T) : defaultValue;
  }

  private set<T>(key: string, value: T): void {
    if (!this.config) {
      return;
    }
    this.config[key as keyof TelemetryConfig] = value as any;
    try {
      writeFileSync(
        this.configPath,
        JSON.stringify(this.config, null, 2),
        "utf-8"
      );
    } catch (error) {
      // Ignore write errors
    }
  }

  private notify(): void {
    if (this.isDisabled || !this.config) {
      return;
    }

    // The end-user has already been notified about our telemetry integration. We
    // don't need to constantly annoy them about it.
    // We will re-inform users about the telemetry if significant changes are
    // ever made.
    if (this.get(TELEMETRY_KEY_NOTIFY_DATE, "")) {
      return;
    }
    this.set(TELEMETRY_KEY_NOTIFY_DATE, Date.now().toString());

    if (!isCI) {
      console.log("");
      console.log(
        "xmcp collects anonymous usage data to improve the framework."
      );
      console.log("   No personal information is collected.");
      console.log(
        "   You can learn more and opt-out by visiting: https://xmcp.dev/telemetry"
      );
      console.log("   Or disable with: npx xmcp telemetry disable");
      console.log("");
    }
  }

  get anonymousId(): string {
    this.notify();

    const val = this.get<string>(TELEMETRY_KEY_ID);
    if (val) {
      return val;
    }

    const generated = randomBytes(32).toString("hex");
    this.set(TELEMETRY_KEY_ID, generated);
    return generated;
  }

  get salt(): string {
    const val = this.get<string>(TELEMETRY_KEY_SALT);
    if (val) {
      return val;
    }

    const generated = randomBytes(16).toString("hex");
    this.set(TELEMETRY_KEY_SALT, generated);
    return generated;
  }

  get isDisabled(): boolean {
    if (!this.config || this.isEnvTelemetryDisabled()) {
      return true;
    }
    return this.get<boolean>(TELEMETRY_KEY_ENABLED, true) === false;
  }

  get isEnabled(): boolean {
    return (
      !this.isEnvTelemetryDisabled() &&
      !!this.config &&
      this.get<boolean>(TELEMETRY_KEY_ENABLED, true) !== false
    );
  }

  setEnabled(enabled: boolean): string | undefined {
    this.set(TELEMETRY_KEY_ENABLED, !!enabled);
    return this.configPath;
  }

  /**
   * Create a one-way hash with salt.
   * This ensures the hash is truly one-way and prevents dictionary attacks.
   */
  oneWayHash(payload: BinaryLike): string {
    const hash = createHash("sha256");

    // Always prepend the payload value with salt. This ensures the hash is truly
    // one-way.
    hash.update(this.salt);

    // Update is an append operation, not a replacement. The salt from the prior
    // update is still present!
    hash.update(payload);
    return hash.digest("hex");
  }

  clear(): void {
    try {
      if (existsSync(this.configPath)) {
        unlinkSync(this.configPath);
      }
    } catch (error) {
      // Ignore errors
    }
  }

  get configFilePath(): string {
    return this.configPath;
  }
}
