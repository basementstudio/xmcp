/** A named value or function injected into the sandbox environment */
export interface SandboxGlobal {
  /** Global variable name accessible in agent code */
  name: string;
  /** Whether this is static data or a callable function */
  type: "value" | "function";
  /** Data to inject (serialized as JSON string in sandbox). Used when type is "value". */
  value?: unknown;
  /** Async host function callable from sandbox code. Used when type is "function". */
  fn?: (...args: unknown[]) => Promise<unknown> | unknown;
}

/**
 * Sandbox engine to use:
 * - "quickjs" (default): WASM-based QuickJS sandbox. Full isolation. Single await only.
 * - "host": Uses AsyncFunction on the host. Supports multiple await/chaining. Weaker isolation (scoped params only).
 */
export type SandboxEngine = "quickjs" | "host";

/** Configuration for a single sandbox execution */
export interface SandboxOptions {
  /** Values and functions available to agent code */
  globals: SandboxGlobal[];
  /** Maximum execution time in milliseconds (default: 30000) */
  timeoutMs?: number;
  /** Maximum heap memory in bytes (default: 50MB, quickjs only) */
  memoryLimitBytes?: number;
  /**
   * Sandbox engine to use (default: "quickjs").
   * - "quickjs": Full WASM isolation. Best for data-only code (search). Single await only.
   * - "host": Runs on Node.js with scoped params. Supports chained await. Use for API calls.
   */
  engine?: SandboxEngine;
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
