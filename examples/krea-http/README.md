# Krea + xmcp

Generate images with Krea 3, or edit them by passing reference images. An authenticated, stateless HTTP MCP server.

| Tool               | Purpose                                                                         |
| ------------------ | ------------------------------------------------------------------------------- |
| `generate-image`   | Generate an image, or edit up to 8 reference images given as public https URLs. |
| `get-image-job`    | Wait for a job and return its image, or its status.                             |
| `cancel-image-job` | Cancel a job that is still queued or processing.                                |

## Provider access

Create an API token on the [Krea API page](https://www.krea.ai/app/api). API access must be enabled for the workspace; if it is not, contact Krea support. Jobs are paid from a prepaid API balance, separate from app compute units. Failed and cancelled jobs are not billed.

The server calls `https://api.krea.ai/generate/image/krea/krea-3` and `/jobs/{id}` with a Bearer token. Submissions are never retried.

## Run locally

Use Node.js 26 and pnpm. From the repository root:

```sh
pnpm install
pnpm exec turbo run build --filter=xmcp --filter=@xmcp-dev/compiler
pnpm install --frozen-lockfile
cp examples/krea-http/.env.example examples/krea-http/.env
```

Fill in `examples/krea-http/.env`:

```bash
KREA_API_KEY=
MCP_API_KEY=
```

Generate `MCP_API_KEY` with `openssl rand -hex 32` and keep `.env` private. Then:

```sh
cd examples/krea-http
pnpm build && pnpm start
```

Connect an MCP client to `http://localhost:3001/mcp` and send the client key as `x-api-key` on every request.

## Results

Generation runs as a provider job. Each call answers within about 50 seconds, counted from when the tool starts, and sends MCP progress notifications while it polls. When the job finishes, the result contains the image inline and a JSON summary with the provider link. Longer jobs return their `jobId` instead; call `get-image-job` with it to keep waiting. If the provider stops responding after a submission, the tool still returns the `jobId`. Cancelling the MCP request stops waiting but does not cancel the provider job. Images larger than 8 MB come back as a link only.

`thinkingMode: "high"` reasons longer about the prompt and costs more. An empty balance or a plan without the requested option returns a tool error instead of a job.

## Tests

```sh
pnpm test        # provider client with fetch replaced by fakes
pnpm test:smoke  # built server: auth, discovery, tool calls, invalid input, both MCP protocol versions
```

No test makes a live provider request. Tested against Krea's documented API on November 24, 2026.

See the [Krea guide](https://xmcp.dev/docs/integrations/krea).
