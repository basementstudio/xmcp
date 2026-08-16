import { promises as fs } from "node:fs";
import path from "node:path";
import { createTaskStore, type TaskRecord } from "xmcp";

/**
 * A file-backed task store.
 *
 * Task state must live OUTSIDE the request: xmcp's HTTP transport is stateless
 * and builds a fresh server per request, so `tasks/get`, `tasks/result`,
 * `tasks/list` and `tasks/cancel` can only work if the state is persisted
 * somewhere later requests can read.
 *
 * `createTaskStore` owns all the protocol logic (ids, timestamps, status
 * transitions, TTL, pagination); we only provide get/set/delete/list over a
 * JSON record. Swap these four methods for Redis, a database, or a KV service.
 */
const dir = path.resolve(process.cwd(), ".tasks");
const file = (taskId: string) => path.join(dir, `${taskId}.json`);

export const store = createTaskStore({
  async get(taskId) {
    try {
      return JSON.parse(await fs.readFile(file(taskId), "utf-8")) as TaskRecord;
    } catch {
      return null;
    }
  },
  async set(taskId, record) {
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(file(taskId), JSON.stringify(record), "utf-8");
  },
  async delete(taskId) {
    await fs.rm(file(taskId), { force: true });
  },
  async list() {
    try {
      const names = (await fs.readdir(dir)).filter((n) => n.endsWith(".json"));
      const records = await Promise.all(
        names.map((n) =>
          fs
            .readFile(path.join(dir, n), "utf-8")
            .then((raw) => JSON.parse(raw) as TaskRecord)
        )
      );
      return records;
    } catch {
      return [];
    }
  },
});

export default store;
