# Gemini Images (Nano Banana) + xmcp

Generate and edit images with Gemini's Nano Banana models. An authenticated, stateless HTTP MCP server.

| Tool             | Purpose                                             |
| ---------------- | --------------------------------------------------- |
| `generate-image` | Generate an image from a prompt.                    |
| `edit-image`     | Edit or combine up to 4 images sent as base64 data. |

## Provider access

Create an API key in [Google AI Studio](https://aistudio.google.com/apikey). The default model is `gemini-nano-banana-2.1`; set `GEMINI_IMAGE_MODEL` to use another, such as `gemini-3-pro-image`.

The server calls the Gemini Interactions API at `https://generativelanguage.googleapis.com/v1beta/interactions` with the `x-goog-api-key` header. Requests are never retried, because a retry would bill a new image.

## Run locally

Use Node.js 26 and pnpm. From the repository root:

```sh
pnpm install
pnpm exec turbo run build --filter=xmcp --filter=@xmcp-dev/compiler
pnpm install --frozen-lockfile
cp examples/gemini-images-http/.env.example examples/gemini-images-http/.env
```

Fill in `examples/gemini-images-http/.env`:

```bash
GEMINI_API_KEY=
MCP_API_KEY=
```

Generate `MCP_API_KEY` with `openssl rand -hex 32` and keep `.env` private. Then:

```sh
cd examples/gemini-images-http
pnpm build && pnpm start
```

Connect an MCP client to `http://localhost:3001/mcp` and send the client key as `x-api-key` on every request.

## Results

The tool returns each image inline as MCP image content, with a JSON summary first.

Images come back in the response, so there are no jobs. Source images for `edit-image` are sent inline as base64, up to about 5 MB each, because this server never downloads client-supplied URLs. The example raises xmcp's request body limit to 30 MB to fit four of them. The server waits up to two minutes for an image. If Gemini declines a prompt and returns no image, the tool returns an error.

## Tests

```sh
pnpm test        # provider client with fetch replaced by fakes
pnpm test:smoke  # built server: auth, discovery, tool calls, invalid input, both MCP protocol versions
```

No test makes a live provider request. Tested against the Gemini image generation guide on November 24, 2026.

See the [Gemini Images (Nano Banana) guide](https://xmcp.dev/docs/integrations/gemini-images).
