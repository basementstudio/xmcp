import {
  generateTaskId,
  type CreateTaskStoreOptions,
  type Task,
  type TaskRecord,
  type TaskStore,
  type TaskStoreAdapter,
} from "../types/task";

const TERMINAL_STATUSES: ReadonlySet<Task["status"]> = new Set([
  "completed",
  "failed",
  "cancelled",
]);

function isExpired(record: TaskRecord): boolean {
  if (record.ttl == null) return false;
  return Date.now() > new Date(record.createdAt).getTime() + record.ttl;
}

/** Strips the stored result so only the public `Task` is returned. */
function toPublicTask({ result: _result, ...task }: TaskRecord): Task {
  return task;
}

function encodeCursor(offset: number): string {
  return Buffer.from(String(offset)).toString("base64");
}

function decodeCursor(cursor: string | undefined): number {
  if (!cursor) return 0;
  const offset = Number(Buffer.from(cursor, "base64").toString());
  return Number.isFinite(offset) && offset >= 0 ? offset : 0;
}

/**
 * Builds a full {@link TaskStore} from minimal persistence primitives.
 *
 * The adapter only stores and loads {@link TaskRecord}s; xmcp handles all of
 * the protocol logic: id generation, timestamps, the working → terminal status
 * machine (with terminal guards), TTL expiry, the public-task projection, and
 * cursor pagination for `tasks/list`.
 *
 * ```ts
 * export default createTaskStore({
 *   get: (id) => kv.get(id),
 *   set: (id, record) => kv.set(id, record),
 *   delete: (id) => kv.del(id),
 *   list: () => kv.values(),
 * });
 * ```
 *
 * Need cursor pagination pushed into the query, or anything else bespoke?
 * Implement {@link TaskStore} directly instead.
 */
export function createTaskStore(
  adapter: TaskStoreAdapter,
  options: CreateTaskStoreOptions = {}
): TaskStore {
  const defaultTtlMs = options.defaultTtlMs ?? null;
  const pollIntervalMs = options.pollIntervalMs ?? 1000;
  const pageSize = options.pageSize ?? 50;

  /** Loads a live record, evicting and dropping it if its TTL has elapsed. */
  async function readLive(taskId: string): Promise<TaskRecord | null> {
    const record = await adapter.get(taskId);
    if (!record) return null;
    if (isExpired(record)) {
      await adapter.delete(taskId);
      return null;
    }
    return record;
  }

  return {
    async createTask(taskParams) {
      const now = new Date().toISOString();
      const record: TaskRecord = {
        taskId: generateTaskId(),
        status: "working",
        ttl: taskParams.ttl ?? defaultTtlMs,
        createdAt: now,
        lastUpdatedAt: now,
        pollInterval: taskParams.pollInterval ?? pollIntervalMs,
      };
      await adapter.set(record.taskId, record);
      return toPublicTask(record);
    },

    async getTask(taskId) {
      const record = await readLive(taskId);
      return record ? toPublicTask(record) : null;
    },

    async storeTaskResult(taskId, status, result) {
      const record = await readLive(taskId);
      if (!record || TERMINAL_STATUSES.has(record.status)) return;
      record.status = status;
      record.result = result;
      record.lastUpdatedAt = new Date().toISOString();
      await adapter.set(taskId, record);
    },

    async getTaskResult(taskId) {
      const record = await readLive(taskId);
      return record?.result ?? {};
    },

    async updateTaskStatus(taskId, status, statusMessage) {
      const record = await readLive(taskId);
      if (!record || TERMINAL_STATUSES.has(record.status)) return;
      record.status = status;
      if (statusMessage !== undefined) record.statusMessage = statusMessage;
      record.lastUpdatedAt = new Date().toISOString();
      await adapter.set(taskId, record);
    },

    async listTasks(cursor) {
      const all = (await adapter.list())
        .filter((record) => !isExpired(record))
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

      const start = decodeCursor(cursor);
      const page = all.slice(start, start + pageSize);
      const next = start + pageSize;

      return {
        tasks: page.map(toPublicTask),
        nextCursor: next < all.length ? encodeCursor(next) : undefined,
      };
    },
  };
}
