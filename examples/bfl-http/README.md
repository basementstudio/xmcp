# Black Forest Labs (FLUX) + xmcp

Generate images with FLUX.2 [pro], or edit and combine up to eight source images. An authenticated, stateless HTTP MCP server.

| Tool             | Purpose                                                                  |
| ---------------- | ------------------------------------------------------------------------ |
| `generate-image` | Generate an image from a prompt.                                         |
| `edit-image`     | Edit or combine up to 8 images given as public https URLs.               |
| `get-image-job`  | Wait for a task by its `pollingUrl` and return its image, or its status. |

## Provider access

Create an API key in the [BFL dashboard](https://dashboard.bfl.ai) and add credits. Set `BFL_MODEL` to use another FLUX model path, such as `flux-2-max`.

The server calls `https://api.bfl.ai/v1/flux-2-pro` with the `x-key` header and polls the `polling_url` BFL returns. It only polls `https://*.bfl.ai/v1/get_result` URLs, so the key never reaches another host. Submissions are never retried.

## Run locally

Use Node.js 26 and pnpm. From the repository root:

```sh
pnpm install
pnpm exec turbo run build --filter=xmcp --filter=@xmcp-dev/compiler
pnpm install --frozen-lockfile
cp examples/bfl-http/.env.example examples/bfl-http/.env
```

Fill in `examples/bfl-http/.env`:

```bash
BFL_API_KEY=
MCP_API_KEY=
```

Generate `MCP_API_KEY` with `openssl rand -hex 32` and keep `.env` private. Then:

```sh
cd examples/bfl-http
pnpm build && pnpm start
```

Connect an MCP client to `http://localhost:3001/mcp` and send the client key as `x-api-key` on every request.

## Results

Generation runs as a provider job. The tool waits up to about 50 seconds and sends MCP progress notifications while it polls. When the job finishes, the result contains the image inline and a JSON summary with the provider link and its expiry. Longer jobs return their `pollingUrl` instead; call `get-image-job` with it to keep waiting. Cancelling the MCP request stops waiting but does not cancel the provider job. Images larger than 8 MB come back as a link only. BFL result links expire ten minutes after the task finishes and cannot be served to browsers directly, which is why the server returns the image itself.

BFL has no cancel endpoint. Moderated requests return a tool error naming the moderation status. `safetyTolerance` runs from 0 (strictest) to 5.

## Tests

```sh
pnpm test        # provider client with fetch replaced by fakes
pnpm test:smoke  # built server: auth, discovery, tool calls, invalid input, both MCP protocol versions
```

No test makes a live provider request. Tested against the BFL API reference on November 24, 2026.

See the [Black Forest Labs (FLUX) guide](https://xmcp.dev/docs/integrations/black-forest-labs).
