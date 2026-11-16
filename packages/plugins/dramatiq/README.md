# @xmcp-dev/dramatiq

A typed client for an HTTP bridge in front of [Dramatiq](https://dramatiq.io) workers. Use it from xmcp tools to enqueue Python background jobs and read their results. It has no runtime dependencies and uses the built-in `fetch`.

```sh
pnpm add @xmcp-dev/dramatiq
```

```ts
// src/tools/enqueue-word-count.ts
import { z } from "zod";
import { getRequestContext, type InferSchema } from "xmcp";
import { createDramatiqClient } from "@xmcp-dev/dramatiq";

export const schema = { text: z.string().min(1).max(10000) };

const jobs = () =>
  createDramatiqClient({
    baseUrl: process.env.DRAMATIQ_BRIDGE_URL!,
    token: process.env.DRAMATIQ_BRIDGE_TOKEN!,
  });

export default async function enqueue(input: InferSchema<typeof schema>) {
  const { jobId } = await jobs().enqueue(
    { actor: "count_words", args: [input.text] },
    { signal: getRequestContext().signal }
  );
  return jobId;
}
```

## API

`createDramatiqClient({ baseUrl, token })` throws an error naming the option when `baseUrl` or `token` is missing or empty, when `baseUrl` is not a valid URL, or when it is not HTTP(S) or contains credentials, a query, or a fragment.

- `enqueue({ actor, args?, kwargs? }, { signal? })` sends `POST /v1/jobs` and resolves to `{ jobId }`.
- `getResult(jobId, { signal? })` sends `GET /v1/jobs/{id}` and resolves to one of:
  - `{ status: "succeeded", result }`
  - `{ status: "failed", error }`
  - `{ status: "unavailable" }`: no result is stored. It does **not** mean the job is queued or running.
  - `{ status: "not_found" }`: unknown job, or its retention expired.

Other bridge responses throw `DramatiqBridgeError` with the HTTP `status` (for example `401`, `422`, or `503`). Malformed responses throw `Error`.

Requests send `Authorization: Bearer <token>`, reject redirects so the token never leaves `baseUrl`, forward `signal`, and are never retried. A failed `enqueue` therefore cannot create duplicates, but a `503` can mean acceptance is unknown.

## Bridge

The bridge is a small service you run next to your workers. It authenticates every request, allowlists actors and validates their arguments, and stores lookup metadata in Redis. The [runnable example](https://github.com/basementstudio/xmcp/tree/main/examples/dramatiq-http) includes a FastAPI bridge, a demonstration actor, and Docker Compose for Redis and the worker. Copy it as a starting point; the bridge is not published to PyPI.

See the [integration guide](https://xmcp.dev/docs/integrations/dramatiq).
