# OpenAPI import

`src/tools/get-pet.ts` was generated from `openapi.json`. It is an ordinary xmcp
tool with a Zod input schema and a GET request to the local example API.

From this directory, start the API in one terminal:

```sh
pnpm api
```

Build and start xmcp in another:

```sh
pnpm build
pnpm start
```

Connect an MCP client to `http://localhost:3001/mcp` and call `get-pet` with
`{"id":"42","verbose":true}`. The result is JSON text with the pet's id, name,
and species. The API needs no credentials.

To try generation, run:

```sh
pnpm generate
```

This writes a fresh copy into `generated-preview/` for comparison with the
checked-in tool. That directory is outside xmcp's tool discovery path. Existing
files are never overwritten; remove the preview directory or choose another
`--out` destination before repeating. To select one operation or another API URL:

```sh
pnpm exec xmcp-dev-cli import-openapi openapi.json --operations get-pet --base-url http://127.0.0.1:3002/api --out another-preview
```

The first importer supports OpenAPI 3.0/3.1 JSON, GET operations, scalar path/query
parameters, and scalar query arrays. Unsupported request shapes fail before
writing files. Generated tools forward MCP cancellation to `fetch`, return
response text, and report non-success HTTP statuses as tool errors.
