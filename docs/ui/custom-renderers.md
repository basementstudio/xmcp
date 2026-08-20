# Schema-Driven UI With `@xmcp-dev/ui`

Schema-driven UI lets an LLM create apps on the fly. The model generates a JSON
schema describing the layout, components, and tool bindings based on what the
user asked, and `@xmcp-dev/ui` renders it into a working app at runtime. The
user never writes UI code.

There are three entry points, each giving you more control:

1. `createRenderJsonTool()`: zero-config, handles everything
2. `Rendered`: custom tool wrapper with the built-in preview engine
3. `App`: full ownership of parsing, validation, and rendering

Start with `createRenderJsonTool()` and move down only when you need more
control.

> If you are building a handwritten React MCP App instead of rendering
> LLM-generated schemas, see [MCP Apps](./mcp-apps.md).

## Quickstart

Import the package stylesheet once:

```css
@import "tailwindcss";
@import "@xmcp-dev/ui/styles.css";

@theme {
  --font-sans: "Geist", ui-sans-serif, sans-serif;
}
```

Expose the `render-json` tool:

```tsx
import { createRenderJsonTool } from "@xmcp-dev/ui";

const renderJsonTool = createRenderJsonTool();

export const metadata = renderJsonTool.metadata;
export const schema = renderJsonTool.schema;
export default renderJsonTool.handler;
```

You can also re-export the packaged contract directly:

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

The model supplies a `schemaJson` string and the package handles parsing,
validation, progressive preview, theme fallback, and rendering.

## Host-Backed Transport

If tool calls and actions should route through the MCP App host instead of
direct HTTP, set the transport mode:

```tsx
import { createRenderJsonTool } from "@xmcp-dev/ui";

const renderJsonTool = createRenderJsonTool({
  transportMode: "host",
});

export const metadata = renderJsonTool.metadata;
export const schema = renderJsonTool.schema;
export default renderJsonTool.handler;
```

Use `transportMode: "auto"` to prefer the host when connected and fall back to
HTTP outside supported hosts. The same option exists on `Rendered` and `App`.

## What The Packaged Path Does For You

The packaged `renderJson` path renders through `Rendered` and handles common
model-generated mistakes:

- Progressive previewing while the model is still streaming
- Partial JSON recovery instead of waiting for the full payload
- Normalizes common safe sizing mistakes
- Rejects unreadable inline `themeTokens`, falling back to the preset theme
- Light mode and `zinc` preset by default

The server author controls defaults while the model only needs to supply
`schemaJson`.

## Using `Rendered`

Use this when you want your own tool definition but still want the built-in
preview engine.

```tsx
import { Rendered } from "@xmcp-dev/ui";
import { z } from "zod";

export const schema = {
  schemaJson: z.string().optional(),
};

export const metadata = {
  name: "renderDashboard",
  description: "Preview an AppSchema with server-owned defaults.",
};

export default function renderDashboard({
  schemaJson,
}: {
  schemaJson?: string;
}) {
  return (
    <Rendered
      schemaJson={schemaJson}
      previewMode="progressive"
      themeMode="light"
      themePreset="zinc"
      transportMode="auto"
    />
  );
}
```

`Rendered` keeps the same core preview behavior as the packaged path:

1. trims and parses `schemaJson`
2. resolves the effective theme mode
3. normalizes known safe sizing mistakes
4. validates complete JSON as an `AppSchema`
5. tries partial JSON repair for progressive preview
6. drops low-contrast inline `themeTokens`
7. keeps the last good preview in progressive mode
8. renders through `App`

## Using `App` Directly

Use this when you want to own the full preview pipeline: JSON parsing, schema
validation, loading states, error handling, and theme control.

```tsx
import { App, validateSchema } from "@xmcp-dev/ui";
import { z } from "zod";

export const schema = {
  schemaJson: z.string().optional(),
};

export const metadata = {
  name: "renderStrictApp",
  description: "Render a validated AppSchema with custom server-side behavior.",
};

export default function renderStrictApp({
  schemaJson,
}: {
  schemaJson?: string;
}) {
  if (!schemaJson?.trim()) {
    return <div>Waiting for schema JSON...</div>;
  }

  try {
    const parsed = JSON.parse(schemaJson);
    const appSchema = validateSchema(parsed);
    return <App schema={appSchema} transportMode="auto" />;
  } catch (error) {
    return (
      <pre>
        {error instanceof Error ? error.message : String(error)}
      </pre>
    );
  }
}
```

`transportMode` controls whether actions use direct HTTP transport, host-backed
transport, or automatic host preference.

## Theme And CSS

Even with the packaged tool or `Rendered`, your app still needs the package
stylesheet:

```css
@import "tailwindcss";
@import "@xmcp-dev/ui/styles.css";

@theme {
  --font-sans: "Geist", ui-sans-serif, sans-serif;
}
```

`Rendered` applies package defaults and contrast fallback behavior. `App`
renders the schema you give it and is better when you want direct control,
including host-owned theme variables via `inheritTheme`.
