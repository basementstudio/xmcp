# Custom Renderers With `@xmcp-dev/ui`

This guide explains the three supported renderer shapes:

1. Use the packaged `renderJson` tool
2. Use your own tool but render with `Rendered`
3. Build a fully custom renderer around `App`

## Choose The Smallest Surface That Works

Use the packaged tool when:

- you want the normal MCP server path
- you do not want to maintain the long `renderJson` schema description yourself
- you want the package defaults for previewing model-generated JSON

Use `Rendered` directly when:

- you want your own tool metadata or wrapper
- you still want package-owned parsing, progressive recovery, theme fallback, and validation hardening

Use `App` directly when:

- you want a completely custom preview experience
- you want to own loading and error states
- you want different progressive parsing or repair behavior
- you want your own theme policy instead of the packaged fallback logic

## Level 1: Packaged `renderJson`

This is the default path:

```tsx
import { createRenderJsonTool } from "@xmcp-dev/ui";

const renderJsonTool = createRenderJsonTool();

export const metadata = renderJsonTool.metadata;
export const schema = renderJsonTool.schema;
export default renderJsonTool.handler;
```

If you want the exact package defaults with no local config, you can also re-export the packaged contract directly:

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

What the package owns here:

- the tool contract
- the `schemaJson` description and guidance for the model
- the preview behavior
- default theme and fallback rules

What you still control:

- `previewMode`
- `themeMode`
- `themePreset`
- `defaultMcpServerUrl`

## Level 2: Custom Tool With `Rendered`

Use this when you want your own tool definition but still want the built-in preview engine.

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
      defaultMcpServerUrl="https://example.com"
    />
  );
}
```

`Rendered` currently does this:

1. trims and parses `schemaJson`
2. resolves the effective theme mode
3. normalizes known safe sizing mistakes
4. validates complete JSON as an `AppSchema`
5. tries partial JSON repair for progressive preview
6. drops low-contrast inline `themeTokens`
7. keeps the last good preview in progressive mode
8. renders through `App`

Important current guarantees:

- `schemaJson` is still the only tool input you need for the normal case
- if inline `themeTokens` are valid, they win
- if inline `themeTokens` are unreadable, `Rendered` silently falls back to the packaged preset theme
- if the stream becomes temporarily invalid after a good preview exists, `Rendered` keeps showing the last good UI

## Level 3: Fully Custom Renderer With `App`

Use this when you want to own the full preview pipeline.

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
    return <App schema={appSchema} />;
  } catch (error) {
    return (
      <pre>
        {error instanceof Error ? error.message : String(error)}
      </pre>
    );
  }
}
```

When you use `App` directly, you own all of this:

- JSON parsing
- partial repair or streaming behavior
- schema normalization
- validation fallback rules
- loading and error states
- theme handling
- contrast protection for generated `themeTokens`

That is the escape hatch for deep customization.

## Theme Behavior

There are two different theme paths:

### `Rendered`

`Rendered` applies package-owned defaults:

- default theme mode is `light`
- default preset is `zinc`
- low-contrast inline `themeTokens` are rejected
- fallback preset theme is applied automatically

### `App`

`App` renders the schema you give it:

- valid `themeTokens` are applied directly
- no extra contrast guard is added unless you add it
- if you want host-owned theme variables, render with `inheritTheme`

That means `Rendered` is safer for model-generated themes, while `App` is better when you want direct control.

## Minimal CSS Expectation

Even with the packaged tool or `Rendered`, your app still needs Tailwind to scan the package classes.

Installed package example:

```css
@import "tailwindcss";
@import "@xmcp-dev/ui/styles.css";

@theme {
  --font-sans: "Geist", ui-sans-serif, sans-serif;
}
```

`@xmcp-dev/ui/styles.css` owns the Tailwind package scanning internally, so consumers do not need to reference package internals.

You also do not need to copy the old preset theme CSS blocks for the packaged renderer path.

## What Most Users Should Do

Start with `createRenderJsonTool()`.

Only move to `Rendered` if you want a custom tool wrapper.

Only move to `App` if you explicitly want to own the preview engine.

Package quick start:

- [packages/ui/README.md](/Users/0xkoller/xmcp/xmcp/packages/ui/README.md)
