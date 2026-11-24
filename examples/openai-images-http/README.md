# OpenAI Images + xmcp

Generate and edit images with OpenAI's GPT image models. An authenticated, stateless HTTP MCP server.

| Tool             | Purpose                                                                            |
| ---------------- | ---------------------------------------------------------------------------------- |
| `generate-image` | Generate up to 4 images from a prompt.                                             |
| `edit-image`     | Edit or combine up to 16 images given as public https URLs, with an optional mask. |

## Provider access

Create an API key in the [OpenAI platform](https://platform.openai.com/api-keys). Some image models require organization verification. The default model is `gpt-image-2.6-flare`; set `OPENAI_IMAGE_MODEL` to use another.

The server calls `https://api.openai.com/v1/images/generations` and `/images/edits` with a Bearer token. OpenAI downloads the edit source and mask URLs itself; this server never fetches client-supplied URLs. Requests are never retried, because a retry would bill new images.

## Run locally

Use Node.js 26 and pnpm. From the repository root:

```sh
pnpm install
pnpm exec turbo run build --filter=xmcp --filter=@xmcp-dev/compiler
pnpm install --frozen-lockfile
cp examples/openai-images-http/.env.example examples/openai-images-http/.env
```

Fill in `examples/openai-images-http/.env`:

```bash
OPENAI_API_KEY=
MCP_API_KEY=
```

Generate `MCP_API_KEY` with `openssl rand -hex 32` and keep `.env` private. Then:

```sh
cd examples/openai-images-http
pnpm build && pnpm start
```

Connect an MCP client to `http://localhost:3001/mcp` and send the client key as `x-api-key` on every request.

## Results

The tool returns each image inline as MCP image content, with a JSON summary first.

Images come back in the response, so there are no jobs. High-quality images can take more than a minute; the server waits up to two minutes. If your MCP client times out sooner, raise its timeout. A cancelled or timed-out call may still be billed. `background: "transparent"` needs `png` or `webp` output.

## Tests

```sh
pnpm test        # provider client with fetch replaced by fakes
pnpm test:smoke  # built server: auth, discovery, tool calls, invalid input, both MCP protocol versions
```

No test makes a live provider request. Tested against the OpenAI Images API reference on November 24, 2026.

See the [OpenAI Images guide](https://xmcp.dev/docs/integrations/openai-images).
