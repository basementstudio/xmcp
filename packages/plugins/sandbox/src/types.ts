import type { NetworkPolicy } from "@vercel/sandbox";

/** Configuration for a single sandbox execution */
export interface SandboxOptions {
  /** Named values available to agent code inside the sandbox. Each value is a string (raw or JSON-serialized). */
  globals?: Record<string, string>;
  /** Maximum execution time in milliseconds (default: 30000) */
  timeoutMs?: number;
  /** Environment variables injected into the VM's process.env. Use for secrets instead of globals. */
  env?: Record<string, string>;
  /**
   * Network policy for the sandbox VM.
   * - "allow-all" (default): full internet access
   * - "deny-all": no network access
   * - { allow: ["domain.com"] }: allowlist specific domains
   */
  networkPolicy?: NetworkPolicy;
  /** npm packages to install in the VM before executing agent code. */
  packages?: string[];
  /** Resume from a snapshot instead of a fresh VM. Use createSnapshot() to create one. */
  snapshotId?: string;
}

/** Options for creating a snapshot */
export interface CreateSnapshotOptions {
  /** npm packages to pre-install in the snapshot */
  packages?: string[];
  /** Environment variables to set in the snapshot */
  env?: Record<string, string>;
}

/** The outcome of a sandbox execution. Always returned, never throws. */
export interface SandboxResult {
  /** Whether execution completed without error */
  success: boolean;
  /** The return value from agent code (if success) */
  data?: unknown;
  /** Error message (if failure) */
  error?: string;
}

export type { NetworkPolicy };
