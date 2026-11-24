# Topaz + xmcp

Upscale and enhance images with Topaz Labs' standard and generative models. An authenticated, stateless HTTP MCP server.

| Tool                 | Purpose                                                                                      |
| -------------------- | -------------------------------------------------------------------------------------------- |
| `upscale-image`      | Upscale an image from a public https URL. Set `generative: true` for models that add detail. |
| `get-upscale-job`    | Wait for a job and return the result with a fresh one-hour link, or its progress.            |
| `cancel-upscale-job` | Cancel a job that has not finished.                                                          |

## Provider access

Create an API key in your [Topaz account](https://www.topazlabs.com/api). The API needs an active developer subscription and credits; there is no free tier. Jobs are billed by output megapixels. Service-side failures are refunded.

The server sends the source image's URL to `https://api.topazlabs.com/image/v1` with the `X-API-Key` header, so Topaz downloads the image itself. Submissions are never retried.

## Run locally

Use Node.js 26 and pnpm. From the repository root:

```sh
pnpm install
pnpm exec turbo run build --filter=xmcp --filter=@xmcp-dev/compiler
pnpm install --frozen-lockfile
cp examples/topaz-http/.env.example examples/topaz-http/.env
```

Fill in `examples/topaz-http/.env`:

```bash
TOPAZ_API_KEY=
MCP_API_KEY=
```

Generate `MCP_API_KEY` with `openssl rand -hex 32` and keep `.env` private. Then:

```sh
cd examples/topaz-http
pnpm build && pnpm start
```

Connect an MCP client to `http://localhost:3001/mcp` and send the client key as `x-api-key` on every request.

## Results

Generation runs as a provider job. The tool waits up to about 50 seconds and sends MCP progress notifications while it polls. When the job finishes, the result contains the image inline and a JSON summary with the provider link and its expiry. Longer jobs return their `jobId` instead; call `get-upscale-job` with it to keep waiting. Cancelling the MCP request stops waiting but does not cancel the provider job. Images larger than 8 MB come back as a link only. Topaz download links expire one hour after they are issued. Call `get-upscale-job` again for a fresh one; results are kept for seven days.

Pass a Topaz model name in `model`, for example `"High Fidelity V2"`, or leave it out for Topaz's default. Check the names in Topaz's model playground, because the documented lists differ. A finished job is charged in full even if you cancel it.

## Tests

```sh
pnpm test        # provider client with fetch replaced by fakes
pnpm test:smoke  # built server: auth, discovery, tool calls, invalid input, both MCP protocol versions
```

No test makes a live provider request. Tested against the Topaz Image API reference on November 24, 2026.

See the [Topaz guide](https://xmcp.dev/docs/integrations/topaz).
