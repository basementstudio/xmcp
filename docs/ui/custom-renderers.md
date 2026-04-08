# Custom Renderers And MCP Apps With `@xmcp-dev/ui`

This guide explains the main UI surfaces in `@xmcp-dev/ui`:

1. use the packaged `renderJson` tool
2. use your own tool but render with `Rendered`
3. build a fully custom renderer around `App`
4. build a handwritten React MCP App with `useMcpApp()`

## Choose The Smallest Surface That Works

Use the packaged `renderJson` tool when:

- you want the normal schema-driven MCP server path
- you do not want to maintain the long `renderJson` schema description yourself
- you want the package defaults for previewing model-generated JSON

Use `Rendered` directly when:

- you want your own tool metadata or wrapper
- you still want package-owned parsing, progressive recovery, theme fallback, and validation hardening

Use `App` directly when:

- you want to own the full preview pipeline
- you want custom loading and error states
- you want to decide whether the renderer uses HTTP or host-backed transport

Use `useMcpApp()` when:

- you are building a handwritten React MCP App
- the UI should call tools and host APIs directly
- you want host context, view modes, resource reads, messaging, or model-context updates

## Level 1: Packaged `renderJson`

This is the default schema-driven path:

```tsx
import { createRenderJsonTool } from "@xmcp-dev/ui";

const renderJsonTool = createRenderJsonTool();

export const metadata = renderJsonTool.metadata;
export const schema = renderJsonTool.schema;
export default renderJsonTool.handler;
```

If you want the exact package defaults with no local config, you can also
re-export the packaged contract directly:

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
- the `schemaJson` guidance for the model
- preview behavior
- default theme and fallback rules

## Host-Backed `renderJson`

If the same schema-driven app should run through the MCP App host, set the
transport mode:

```tsx
import { createRenderJsonTool } from "@xmcp-dev/ui";

const renderJsonTool = createRenderJsonTool({
  transportMode: "host",
});

export const metadata = renderJsonTool.metadata;
export const schema = renderJsonTool.schema;
export default renderJsonTool.handler;
```

Use `transportMode: "auto"` when the same app should prefer a host connection
and still fall back to HTTP outside supported hosts.

## Level 2: Custom Tool With `Rendered`

Use this when you want your own tool definition and still want the built-in
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

## Level 3: Fully Custom Renderer With `App`

Use this when you want to control the rendering pipeline directly.

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

When you use `App` directly, you own:

- JSON parsing
- partial repair or streaming behavior
- schema normalization
- validation fallback rules
- loading and error states
- theme handling

`transportMode` controls whether actions use direct HTTP transport, host-backed
transport, or automatic host preference.

## Handwritten React MCP Apps With `useMcpApp()`

Use this path when the UI is not schema-generated and should talk to the host
directly.

```tsx
import { Button, useMcpApp } from "@xmcp-dev/ui";

export default function Demo() {
  const { callTool, readResource, requestDisplayMode } = useMcpApp();

  return (
    <Button
      onClick={async () => {
        await readResource("docs://mcp-app-playbook");
        await requestDisplayMode("fullscreen");
        await callTool("serverStats");
      }}
    >
      Run flow
    </Button>
  );
}
```

`useMcpApp()` exposes:

- `callTool`
- `openLink`
- `requestDisplayMode`
- `readResource`
- `sendMessage`
- `updateModelContext`
- `logMessage`
- `notifySizeChanged`
- `isConnected`
- `hostContext`
- `hostCapabilities`

`useMcpHostBridge()` remains available as a compatibility export, but
`useMcpApp()` is the recommended hook name.

## Auto Size Reporting

If your host supports app size notifications, use `useAutoMcpAppSize()` to
report `ui/notifications/size-changed` from your app root:

```tsx
import { useRef } from "react";
import { AppShell, useAutoMcpAppSize } from "@xmcp-dev/ui";

export default function Demo() {
  const rootRef = useRef<HTMLDivElement>(null);

  useAutoMcpAppSize(rootRef);

  return <AppShell ref={rootRef}>...</AppShell>;
}
```

## Theme And CSS Behavior

Even with the packaged tool or `Rendered`, your app still needs the package
stylesheet:

```css
@import "tailwindcss";
@import "@xmcp-dev/ui/styles.css";

@theme {
  --font-sans: "Geist", ui-sans-serif, sans-serif;
}
```

`Rendered` applies package defaults and contrast fallback behavior.

`App` renders the schema you give it and is better when you want direct control,
including host-owned theme variables via `inheritTheme`.

## What Most Users Should Do

Start with `createRenderJsonTool()` for schema-driven UI.

Move to `Rendered` only when you want a custom tool wrapper.

Move to `App` only when you want direct control of the renderer.

Use `useMcpApp()` when you are building a handwritten React MCP App.

If you are not using `@xmcp-dev/ui`, you can use:

```ts
import { createMcpHostBridge } from "xmcp/host-bridge";
```

Package quick start:

- [packages/ui/README.md](/Users/0xkoller/xmcp/xmcp/packages/ui/README.md)
