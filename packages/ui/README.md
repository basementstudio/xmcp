# `@xmcp-dev/ui`

Schema-driven UI primitives and preview tooling for xmcp MCP servers.

## What You Get

`@xmcp-dev/ui` now ships two default paths:

- A packaged `renderJson` tool contract for the normal MCP server use case
- A packaged `Rendered` preview component for custom tools that still want the built-in preview behavior

Main exports for the default path:

- `createRenderJsonTool`
- `renderJsonMetadata`
- `renderJsonSchema`
- `renderJsonHandler`
- `Rendered`
- `App`

For most servers, the easiest path is:

1. Install `@xmcp-dev/ui`
2. Add a tiny local `render-json` tool file
3. Import the package stylesheet
4. Let the package own the preview behavior

## Default Path

The local tool file can stay intentionally small:

```tsx
import { createRenderJsonTool } from "@xmcp-dev/ui";

const renderJsonTool = createRenderJsonTool();

export const metadata = renderJsonTool.metadata;
export const schema = renderJsonTool.schema;
export default renderJsonTool.handler;
```

If you want the package defaults with no wrapper logic at all, you can also re-export the packaged pieces directly:

```tsx
import {
  renderJsonHandler,
  renderJsonMetadata,
  renderJsonSchema,
} from "@xmcp-dev/ui";

export const metadata = renderJsonMetadata;
export const schema = renderJsonSchema;
export default renderJsonHandler;
```

The LLM only passes one argument:

```json
{
  "schemaJson": "{ \"title\": \"Example App\", \"mcpServerUrl\": \"https://example.com\", \"root\": { \"type\": \"grid\", \"props\": { \"columns\": 1, \"gap\": 16 }, \"children\": [] } }"
}
```

The package owns:

- the `renderJson` tool metadata
- the long schema description and prompting guidance
- JSON parsing and validation
- progressive preview behavior
- default theme selection and fallback handling

## Tailwind Setup

The components are Tailwind-styled, but consumers no longer need to point Tailwind at package internals directly.

Minimal example:

```css
@import "tailwindcss";
@import "@xmcp-dev/ui/styles.css";

@theme {
  --font-sans: "Geist", ui-sans-serif, sans-serif;
}
```

`@xmcp-dev/ui/styles.css` owns the Tailwind `@source` wiring for the package.

The old preset theme CSS blocks are also no longer required for the packaged preview path.

## Built-In Preview Behavior

`createRenderJsonTool()` renders through `Rendered`, which currently does all of this out of the box:

- default preview mode is `progressive`
- default theme mode is `light`
- default preset is shadcn-style `zinc`
- normalizes numeric `image.width`, `image.height`, and `table.columns[].width` into CSS strings
- tries partial JSON recovery while the model is still streaming
- keeps the last good preview in progressive mode instead of flashing back to loading
- rejects low-contrast inline `themeTokens` and falls back to the packaged preset theme

The tool input stays the same:

- `schemaJson?: string`

The rest is server-owned, not LLM-owned.

## Server-Owned Defaults

If you want different defaults without rewriting the tool contract, use `createRenderJsonTool(config)`:

```tsx
import { createRenderJsonTool } from "@xmcp-dev/ui";

const renderJsonTool = createRenderJsonTool({
  previewMode: "strict",
  themeMode: "light",
  themePreset: "slate",
  defaultMcpServerUrl: "https://example.com",
});

export const metadata = renderJsonTool.metadata;
export const schema = renderJsonTool.schema;
export default renderJsonTool.handler;
```

Available config:

- `previewMode?: "strict" | "progressive" | "raw"`
- `themeMode?: "light" | "dark"`
- `themePreset?: "zinc" | "slate" | "stone" | "gray" | "neutral"`
- `defaultMcpServerUrl?: string`

## When To Go Custom

Use the packaged tool when you want the normal path.

Use `Rendered` directly when you want your own tool wrapper but still want the built-in preview engine.

Use `App` directly when you want to own parsing, validation, theme policy, loading states, and progressive behavior yourself.

The full customization guide is here:

- [Custom Renderers](/Users/0xkoller/xmcp/xmcp/docs/ui/custom-renderers.md)

The showcase example that uses the packaged tool contract is here:

- [ui-showcase README](/Users/0xkoller/xmcp/xmcp/examples/ui-showcase/README.md)
