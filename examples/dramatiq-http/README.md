# xmcp with Dramatiq

This example lets MCP clients enqueue Python background jobs and read their results. The xmcp tools use [`@xmcp-dev/dramatiq`](../../packages/plugins/dramatiq) to call a small FastAPI bridge, and the bridge enqueues an allowlisted [Dramatiq](https://dramatiq.io) actor on Redis.

```text
MCP client → xmcp (enqueue-word-count, get-job-result) → bridge (FastAPI) → Redis → Dramatiq worker
```

- `enqueue-word-count` submits the `count_words` actor and returns a job ID. It is never retried.
- `get-job-result` returns `succeeded`, `failed`, `unavailable`, or `not_found`.

## Bridge API (v1)

Every request requires `Authorization: Bearer <DRAMATIQ_BRIDGE_TOKEN>`.

| Request             | Response                                                                                                                                                                |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /v1/jobs`     | `202 { "jobId" }`. `422` for unknown actors or invalid arguments. `503` if Redis is unreachable.                                                                        |
| `GET /v1/jobs/{id}` | `200 { "status": "succeeded", "result" }`, `{ "status": "failed", "error" }`, or `{ "status": "unavailable" }`. `404` when the job is unknown or its retention expired. |

The bridge validates `{ actor, args, kwargs }` against an explicit registry before enqueueing. It never imports modules by name, and the TypeScript side never serializes broker messages. Failure details stay in the worker logs; clients see `Actor execution failed`.

`unavailable` means no result is stored. Dramatiq's result backend cannot tell whether a job is queued, running, or lost, so `unavailable` is not proof of progress. A `503` on enqueue means acceptance is unknown: the job might already be queued, so check before resubmitting.

The bridge stores lookup metadata in Redis, so results survive bridge restarts. Metadata expires `RESULT_RETENTION_SECONDS` after enqueue, and results expire the same interval after completion. Choose a retention longer than your queue delay plus run time.

Scheduling, cancellation, worker monitoring, and per-tenant job ownership are out of scope.

## Setup

Requires Node 22, pnpm, and either Docker or Python 3.10+ with a local Redis.

```sh
pnpm install
pnpm exec turbo run build --filter=xmcp --filter=@xmcp-dev/compiler --filter=@xmcp-dev/dramatiq
cp examples/dramatiq-http/.env.example examples/dramatiq-http/.env
```

Set distinct secrets for `MCP_API_KEY` and `DRAMATIQ_BRIDGE_TOKEN` in `.env`.

## Run

Start Redis, the bridge, and one worker:

```sh
cd examples/dramatiq-http
docker compose --env-file .env up --build
```

Without Docker, run the same processes from `bridge/` with a local Redis:

```sh
cd bridge
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
export REDIS_URL=redis://localhost:6379/0 DRAMATIQ_BRIDGE_TOKEN=<same as .env>
.venv/bin/dramatiq actors --processes 1 --threads 1 &
.venv/bin/uvicorn app:app --port 8000
```

Then start xmcp:

```sh
pnpm build && pnpm start
```

Connect an MCP client to `http://localhost:3001/mcp` with `Authorization: Bearer <MCP_API_KEY>`. Call `enqueue-word-count` with `{ "text": "one two three" }`, then call `get-job-result` with the returned `jobId`. Whitespace-only text makes the actor fail, which shows the `failed` state.

## Tests

```sh
pnpm test:smoke   # compiled xmcp server against a local bridge stand-in
pnpm test         # real Redis, worker, and bridge (skipped without bridge/.venv)
```

The end-to-end test starts `redis-server`, a worker, and the bridge. It covers results, a bridge restart, actor failure, unknown and expired jobs, an idle worker, auth, allowlisting, and a Redis outage. It needs `redis-server` on `PATH` (or `REDIS_SERVER`) and the venv above (or `BRIDGE_PYTHON`).

Tested with Dramatiq 2.2.0, FastAPI 0.135.1, Uvicorn 0.41.0, and Redis 7.4 (Compose) and 8.10 (local).

See the [Dramatiq integration guide](https://xmcp.dev/docs/integrations/dramatiq).
