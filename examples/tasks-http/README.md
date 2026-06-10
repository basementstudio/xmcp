# Tasks over HTTP

This example shows how to run a tool as an [MCP task](https://modelcontextprotocol.io/specification/2025-11-25/basic/utilities/tasks)
in xmcp: a long-running, pollable operation that returns immediately and is
completed **out-of-band, by a separate process**.

xmcp keeps this **stateless**. The HTTP transport builds a fresh server per
request and never holds task state in memory. All task state lives in a
**task store** that you implement against external storage.

## Two processes, one shared store

The whole point of tasks is that the work runs **somewhere other than the
request**. This example makes that boundary explicit with two processes that
share nothing but on-disk state:

```
MCP server (the tool)            worker (separate process)
  enqueue job  ──────►  .queue/  ──────►  run job
                                            │
            tasks/get / tasks/result        ▼
  client  ◄──────────────  .tasks/  ◄──  store result
```

1. A tool opts in with `taskSupport: "required"` in its `metadata`
   (`src/tools/long-job.ts`). When a client calls it with a `task` field, xmcp
   creates a task in the store and returns immediately. **The tool only drops a
   job on the queue — it does not run the work.**
2. The worker (`src/worker.ts`) is a standalone process. It watches the queue,
   runs the job, and writes the result back through the **same** task store.
3. Clients poll `tasks/get` for status and call `tasks/result` for the output.
   They read from the store the worker wrote to — the server that created the
   task is long gone.

In production the queue is a real queue (SQS, a database table, Upstash) and the
worker is a queue consumer or cron; the shape is identical.

The task store here writes one JSON file per task under `.tasks/`, and the queue
writes one job file under `.queue/`. Both are dependency-free and fine for
local/single-node use. For serverless or multi-instance deployments, back the
store with Redis, a database, or a KV service.

> The worker logs each job as it runs. That console output is the point of this
> example — it makes execution happening *elsewhere* visible.

## Run it

You need **two terminals** — the separation is the lesson.

Terminal 1 — the MCP server (enqueues jobs):

```bash
pnpm dev      # or: pnpm build && pnpm start
```

Terminal 2 — the worker (executes jobs elsewhere):

```bash
pnpm worker
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

Watch terminal 2: the worker prints `▶ running "demo" (3s)…` and then
`✓ completed`. Now poll status and fetch the result:

```bash
curl -s http://127.0.0.1:3001/mcp -H 'content-type: application/json' \
  -H 'accept: application/json, text/event-stream' \
  -d '{ "jsonrpc": "2.0", "id": 2, "method": "tasks/get", "params": { "taskId": "<taskId>" } }'

curl -s http://127.0.0.1:3001/mcp -H 'content-type: application/json' \
  -H 'accept: application/json, text/event-stream' \
  -d '{ "jsonrpc": "2.0", "id": 3, "method": "tasks/result", "params": { "taskId": "<taskId>" } }'
```

Because all state lives in the store, you can kill and restart the server
between `tools/call` and `tasks/get` — the task still resolves. That is
statelessness.

## Notes and caveats

- **The tool never does the work.** It enqueues and returns; a separate process
  completes the task and writes the result back through the store. This is what
  makes tasks safe on serverless, where the request function may freeze the
  moment it returns.
- **`required` vs `optional`.** Use `required` for work that completes
  out-of-band. With `optional`, a client that calls the tool *without* a `task`
  field expects a normal synchronous result, so an `optional` tool should return
  a `CallToolResult` directly in that case.
- **Returning a string.** The worker stores a plain `string`; xmcp coerces it
  into a `CallToolResult` when the client reads it back, exactly like returning
  a string from a normal tool.
- **Security.** Stateless HTTP has no requestor identity, so the task ID is the
  only access control. Use cryptographically secure IDs (see `generateTaskId`)
  and short TTLs. Add authentication if you need stronger isolation.
