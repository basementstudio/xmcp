/**
 * Public contract for MCP tasks support in xmcp.
 *
 * Tasks let a tool call run as a long-running, pollable operation (the MCP
 * "tasks" utility). xmcp keeps this fully stateless: it never holds task state
 * in server memory. Instead, you provide a `TaskStore` implementation backed by
 * external storage (Redis, a database, a KV store, etc.) in `src/task-store.ts`.
 *
 * The underlying protocol handlers (`tasks/get`, `tasks/result`, `tasks/list`,
 * `tasks/cancel`) and the `tools/call` task negotiation are implemented by the
 * MCP SDK; xmcp wires your store into them.
 *
 * Security note: in unauthenticated stateless HTTP there is no requestor
 * identity to bind tasks to, so task IDs are the only access control. Generate
 * cryptographically secure IDs (see {@link generateTaskId}) and prefer short
 * TTLs. If you need stronger isolation, add authentication.
 */
import type {
  TaskStore as SdkTaskStore,
  CreateTaskOptions,
} from "@modelcontextprotocol/sdk/experimental/tasks/interfaces";
import type { Result, Task } from "@modelcontextprotocol/sdk/types";

export type { Task, CreateTaskOptions };

/**
 * A task result a tool or worker may produce. A bare `string` or `number` is
 * coerced into a `CallToolResult` when the client reads it back (same as
 * returning a string from a normal tool). An object must already be a valid
 * result (`content` / `structuredContent` / `isError`).
 */
export type TaskResult = Result | string | number;

/**
 * Contract for external task storage. Implement this in `src/task-store.ts`.
 *
 * Identical to the MCP SDK's task store, except `storeTaskResult` accepts — and
 * `getTaskResult` may return — a bare `string`/`number`, which xmcp coerces.
 */
export interface TaskStore
  extends Omit<SdkTaskStore, "storeTaskResult" | "getTaskResult"> {
  storeTaskResult(
    taskId: string,
    status: "completed" | "failed",
    result: TaskResult,
    sessionId?: string
  ): Promise<void>;
  getTaskResult(taskId: string, sessionId?: string): Promise<TaskResult>;
}

/**
 * A persisted task: the public `Task` plus the stored result. This is the
 * opaque record a {@link TaskStoreAdapter} reads and writes; xmcp owns its
 * shape and handles the protocol logic around it.
 */
export type TaskRecord = Task & { result?: TaskResult };

/**
 * Minimal persistence primitives for {@link createTaskStore}. Each method just
 * stores or loads a JSON-serializable {@link TaskRecord} by id — no protocol
 * logic. Maps directly onto any KV or database (Redis, Upstash, a table, …).
 */
export interface TaskStoreAdapter {
  /** Load a record by id, or `null`/`undefined` if it does not exist. */
  get(taskId: string): Promise<TaskRecord | null | undefined>;
  /** Create or overwrite a record. */
  set(taskId: string, record: TaskRecord): Promise<void>;
  /** Remove a record. */
  delete(taskId: string): Promise<void>;
  /** Return every stored record (used only for `tasks/list`). */
  list(): Promise<TaskRecord[]>;
}

/** Options for {@link createTaskStore}. All optional. */
export interface CreateTaskStoreOptions {
  /** Task lifetime in ms when the requestor does not ask for one. `null` (default) = unlimited. */
  defaultTtlMs?: number | null;
  /** Suggested client poll interval in ms, surfaced in task responses. Default `1000`. */
  pollIntervalMs?: number;
  /** Page size for `tasks/list`. Default `50`. */
  pageSize?: number;
}

/**
 * Generates a cryptographically secure task identifier.
 *
 * Convenience for `TaskStore.createTask` implementations. Uses the platform Web
 * Crypto API, available on Node.js 20+ and Cloudflare Workers.
 */
export function generateTaskId(): string {
  return globalThis.crypto.randomUUID();
}
