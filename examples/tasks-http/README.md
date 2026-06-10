# Tasks over HTTP

This example shows how to run a tool as an [MCP task](https://modelcontextprotocol.io/specification/2025-11-25/basic/utilities/tasks)
in xmcp: a long-running, pollable operation that returns immediately and is
completed out-of-band.

xmcp keeps this **stateless**. The HTTP transport builds a fresh server per
request and never holds task state in memory. All task state lives in a
**task store** that you implement against external storage.

## How it works

1. You provide a task store in `src/task-store.ts` (default export implementing
   the `TaskStore` interface). Its presence enables tasks and advertises the
   `tasks` capability.
2. A tool opts in by setting `taskSupport: "optional" | "required"` in its
   `metadata`. xmcp registers it as a task-augmented tool.
3. When a client calls the tool with a `task` field, the SDK creates a task in
   your store and returns a `CreateTaskResult` immediately. Your handler kicks
   off the work (here, a detached promise; in production, a queue/worker).
4. The worker writes the result back via the store. Clients poll `tasks/get`
   for status and `tasks/result` for the final output. `tasks/list` and
   `tasks/cancel` are served from the same store.

The store in this example writes one JSON file per task under `.tasks/`. It is
dependency-free and fine for local/single-node use. For serverless or
multi-instance deployments, back the same interface with Redis, a database, or a
KV service.

## Run it

```bash
pnpm dev      # or: pnpm build && pnpm start
```

The server listens on `http://127.0.0.1:3001/mcp`.

## Try the flow

Create a task-augmented call (note the `task` field):

```bash
curl -s http://127.0.0.1:3001/mcp \
  -H 'content-type: application/json' \
  -H 'accept: application/json, text/event-stream' \
  -d '{
    "jsonrpc": "2.0", "id": 1, "method": "tools/call",
    "params": { "name": "long_job", "arguments": { "label": "demo", "seconds": 3 }, "task": { "ttl": 60000 } }
  }'
# -> result.task = { taskId, status: "working", ... }
```

Poll status, then fetch the result once it is `completed`:

```bash
curl -s http://127.0.0.1:3001/mcp -H 'content-type: application/json' \
  -H 'accept: application/json, text/event-stream' \
  -d '{ "jsonrpc": "2.0", "id": 2, "method": "tasks/get", "params": { "taskId": "<taskId>" } }'

curl -s http://127.0.0.1:3001/mcp -H 'content-type: application/json' \
  -H 'accept: application/json, text/event-stream' \
  -d '{ "jsonrpc": "2.0", "id": 3, "method": "tasks/result", "params": { "taskId": "<taskId>" } }'
```

## Notes and caveats

- **`required` vs `optional`.** Use `required` for work that completes
  out-of-band. With `optional`, a client that calls the tool *without* a `task`
  field expects a normal synchronous result, so an `optional` tool should return
  a `CallToolResult` directly in that case.
- **Execution is yours.** xmcp creates the task and serves reads; it does not run
  background work. On serverless, enqueue the work so it survives the function
  returning, and have the worker write the result through the store.
- **Security.** Stateless HTTP has no requestor identity, so the task ID is the
  only access control. Use cryptographically secure IDs (see `generateTaskId`)
  and short TTLs. Add authentication if you need stronger isolation.
