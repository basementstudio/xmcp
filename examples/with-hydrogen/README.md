# xmcp with Shopify Hydrogen

This example mounts an xmcp server at `/mcp` inside a React Router app built with [Hydrogen](https://shopify.dev/docs/storefronts/hydrogen) commerce primitives. The storefront page and the MCP tools share one server-only Storefront client (`src/storefront.server.ts`).

- `search-products` takes `query` (1–200 characters) and `first` (1–20, default 5). It returns handles, titles, availability, and minimum prices with currency.
- `get-product` takes a product `handle` and returns the product, or `null`.

Both tools are read-only. Catalog requests carry no buyer context: the MCP bearer token and caller cookies are never forwarded to Shopify, and `PRIVATE_STOREFRONT_API_TOKEN` stays on the server.

## Setup

Requires Node 26 and pnpm. From the repository root:

```sh
pnpm install
pnpm exec turbo run build --filter=xmcp --filter=@xmcp-dev/compiler
cp examples/with-hydrogen/.env.example examples/with-hydrogen/.env
```

Set `MCP_API_KEY` in `.env`. The example uses Shopify's tokenless [mock.shop](https://mock.shop) store `pets.mock.shop`, so no Shopify credentials are needed.

To connect a real store, set `PUBLIC_STORE_DOMAIN=your-store.myshopify.com` and `PRIVATE_STOREFRONT_API_TOKEN` from the Headless or Hydrogen sales channel. With a private token, the client uses Hydrogen's `private_no_buyer_context` mode.

## Run

```sh
cd examples/with-hydrogen
pnpm build && pnpm start   # http://localhost:3000
```

Open `/` for the storefront page. Connect an MCP client to `http://localhost:3000/mcp` with `Authorization: Bearer <MCP_API_KEY>` and call `search-products` with `{ "query": "bed" }`.

For development, `pnpm dev` runs `xmcp dev` and `react-router dev` together.

## Tests

```sh
pnpm test        # Storefront helpers against a local GraphQL stand-in
pnpm test:smoke  # built server: storefront route, /mcp auth, tools, input bounds
pnpm test:live   # queries mock.shop (or your configured store) over the network
```

Oxygen deployment, cart mutations, checkout, and Customer Account API access are out of scope.

Tested with `@shopify/hydrogen` 2026.10.3, React Router 8.4, and Vite 8.

See the [Hydrogen integration guide](https://xmcp.dev/docs/integrations/shopify-hydrogen).
