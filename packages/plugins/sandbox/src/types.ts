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
  /** VM runtime. Supports "node24" (default), "node22", "python3.13". */
  runtime?: string;
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

/** Configuration for the searchTool factory */
export interface SearchToolConfig {
  /** URL of the OpenAPI spec to load and inject as the `spec` global */
  url: string;
  /** Maximum execution time in milliseconds (default: 10000) */
  timeoutMs?: number;
  /** Network policy for the sandbox VM (default: "deny-all" since search is data-only) */
  networkPolicy?: NetworkPolicy;
  /**
   * Inject built-in search helper functions into the sandbox.
   * When true, agent code gets:
   * - `search(query)` — fuzzy text search across endpoint paths, summaries, and descriptions
   * - `filter({ method?, tag?, path? })` — structured filtering by HTTP method, tag, or path pattern
   * - `endpoints` — pre-parsed array of all endpoints with { path, method, summary, description, tags, parameters }
   *
   * The raw `spec` global is always available regardless of this option.
   * Default: true
   */
  helpers?: boolean;
}

/** Configuration for the executeTool factory */
export interface ExecuteToolConfig {
  /** API base URL injected as the `url` global */
  url: string;
  /** Host env var names to forward into the sandbox's process.env (e.g. ["API_KEY"]) */
  env?: string[];
  /** Network policy for the sandbox VM (default: "allow-all") */
  networkPolicy?: NetworkPolicy;
  /** Maximum execution time in milliseconds (default: 30000) */
  timeoutMs?: number;
  /** npm packages to install in the VM before execution */
  packages?: string[];
}

/** A complete xmcp tool module returned by factory functions */
export interface ToolModule {
  schema: Record<string, unknown>;
  metadata: {
    name: string;
    description: string;
    annotations?: Record<string, unknown>;
  };
  handler: (args: { code: string }) => Promise<unknown>;
}

export type { NetworkPolicy };
