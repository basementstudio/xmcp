# OpenAPI import

`src/tools/get-pet.ts` and `update-pet.ts` are generated from `openapi.json`.
They are ordinary xmcp tools with Zod input schemas and fetch handlers.

From this directory, start the local API in one terminal:

```sh
PET_API_AUTH='Bearer local-example-token' pnpm api
```

Build and start xmcp in another, supplying the same example credential:

```sh
pnpm build
PET_API_AUTH='Bearer local-example-token' pnpm start
```

Connect an MCP client to `http://localhost:3001/mcp`:

- Call `get-pet` with `{"id":"42","verbose":true}` to read the pet. This route is public.
- Call `update-pet` with `{"id":"42","X-Request-Label":"demo/run","body":{"name":"Mochi","active":false}}` to send a JSON body, a raw header, and runtime Authorization. The API echoes the update without persisting it.

The credential is read from `PET_API_AUTH` on each tool call, never at generation
or build time. It is not a tool argument. Generated handlers forward MCP
cancellation to fetch, return response text, and report non-success statuses as
tool errors.

To generate both tools into `generated-preview/` for comparison, run:

```sh
pnpm generate
```

The preview directory is outside tool discovery. Repeating the command refuses
to overwrite files. To explicitly replace them:

```sh
pnpm exec xmcp-dev-cli import-openapi openapi.json --operations get-pet --out generated-preview --overwrite
pnpm exec xmcp-dev-cli import-openapi openapi.json --operations update-pet --auth-env PET_API_AUTH --out generated-preview --overwrite
```

Import public and authenticated operations separately: `--auth-env` applies to
all operations selected in that invocation. Use `--out src/tools --overwrite`
instead to regenerate the checked-in files, replacing any manual edits.

The importer supports OpenAPI 3.0/3.1 JSON, GET/POST/PUT/PATCH/DELETE, scalar
path/query/header parameters, query/header arrays, and nested JSON request bodies.
Write operations require `--operations`; the default imports GET only.
Unsupported schemas, encodings, and authentication schemes fail before writing.
