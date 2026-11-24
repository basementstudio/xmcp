# Higgsfield + xmcp

Generate images with Higgsfield Soul and edit them with Grok Image 2.0 on Higgsfield. An authenticated, stateless HTTP MCP server.

| Tool               | Purpose                                                              |
| ------------------ | -------------------------------------------------------------------- |
| `generate-image`   | Generate an image from a prompt with Higgsfield Soul.                |
| `edit-image`       | Edit up to 10 source images (public https URLs) with Grok Image 2.0. |
| `get-image-job`    | Wait for a job and return its image, or its status.                  |
| `cancel-image-job` | Cancel a job that is still queued.                                   |

## Provider access

Create an API key in the [Higgsfield console](https://console.higgsfield.ai). It has two parts, an ID and a secret. Higgsfield bills each output from the account balance; failed and blocked jobs are not charged.

The server calls `https://api.higgsfield.ai` with `Authorization: Key <id>:<secret>`. Each submission sends a fresh `Idempotency-Key` and is never retried.

## Run locally

Use Node.js 26 and pnpm. From the repository root:

```sh
pnpm install
pnpm exec turbo run build --filter=xmcp --filter=@xmcp-dev/compiler
pnpm install --frozen-lockfile
cp examples/higgsfield-http/.env.example examples/higgsfield-http/.env
```

Fill in `examples/higgsfield-http/.env`:

```bash
HIGGSFIELD_API_KEY_ID=
HIGGSFIELD_API_KEY_SECRET=
MCP_API_KEY=
```

Generate `MCP_API_KEY` with `openssl rand -hex 32` and keep `.env` private. Then:

```sh
cd examples/higgsfield-http
pnpm build && pnpm start
```

Connect an MCP client to `http://localhost:3001/mcp` and send the client key as `x-api-key` on every request.

## Results

Generation runs as a provider job. The tool waits up to about 50 seconds and sends MCP progress notifications while it polls. When the job finishes, the result contains the image inline and a JSON summary with the provider link and its expiry. Longer jobs return their `jobId` instead; call `get-image-job` with it to keep waiting. Cancelling the MCP request stops waiting but does not cancel the provider job. Images larger than 8 MB come back as a link only. Output links stay valid until the `expiresAt` Higgsfield reports, at least seven days.

Higgsfield only cancels jobs that are still queued. A job that already started runs to completion.

## Tests

```sh
pnpm test        # provider client with fetch replaced by fakes
pnpm test:smoke  # built server: auth, discovery, tool calls, invalid input, both MCP protocol versions
```

No test makes a live provider request. Tested against Higgsfield's documented API on November 24, 2026.

See the [Higgsfield guide](https://xmcp.dev/docs/integrations/higgsfield).
