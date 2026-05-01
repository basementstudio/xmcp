# `@xmcp-dev/ui`

Schema-driven UI primitives and MCP App helpers for `xmcp`.

## What You Get

`@xmcp-dev/ui` supports two related use cases:

- schema-driven UI with `renderJson`, `Rendered`, and `App`
- custom React MCP Apps with `useMcpApp()`

Main exports:

- `createRenderJsonTool`
- `renderJsonMetadata`
- `renderJsonSchema`
- `renderJsonHandler`
- `Rendered`
- `App`
- `useMcpApp`
- `useMcpHostBridge`
- `useAutoMcpAppSize`

## Default Schema-Driven Path

For most servers, the easiest schema-driven path is still a tiny local
`render-json` tool file:

```tsx
import { createRenderJsonTool } from "@xmcp-dev/ui";

const renderJsonTool = createRenderJsonTool();

export const metadata = renderJsonTool.metadata;
export const schema = renderJsonTool.schema;
export default renderJsonTool.handler;
```

If you want the package defaults with no wrapper logic, you can also
re-export the packaged pieces directly:

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

The package owns:

- the `renderJson` tool metadata
- the long schema description and prompting guidance
- JSON parsing and validation
- progressive preview behavior
- default theme selection and fallback handling

## Host-Backed Schema Apps

If the same schema-driven app should call tools and host APIs through the MCP
App host, use host-backed transport:

```tsx
import { createRenderJsonTool } from "@xmcp-dev/ui";

const renderJsonTool = createRenderJsonTool({
  transportMode: "host",
});

export const metadata = renderJsonTool.metadata;
export const schema = renderJsonTool.schema;
export default renderJsonTool.handler;
```

`transportMode` is also available on `Rendered` and `App`.

Available values:

- `http` for direct MCP HTTP transport
- `host` for MCP App host transport
- `auto` to prefer the host when connected and fall back otherwise

## Custom React MCP Apps

For handwritten React MCP Apps, `useMcpApp()` is the recommended API:

```tsx
import { Button, useMcpApp } from "@xmcp-dev/ui";

export default function Demo() {
  const { callTool, requestDisplayMode, isConnected } = useMcpApp();

  return (
    <Button
      onClick={async () => {
        if (isConnected) {
          await requestDisplayMode("fullscreen");
        }

        await callTool("serverStats");
      }}
    >
      Run tool
    </Button>
  );
}
```

`useMcpApp()` exposes the MCP App runtime surface:

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

`useMcpHostBridge()` still exists and returns the same shape, but `useMcpApp()`
is the recommended public hook.

## Auto Size Reporting

If your host supports app size notifications, `useAutoMcpAppSize()` wires a
`ResizeObserver` to your root element and emits `ui/notifications/size-changed`
automatically:

```tsx
import { useRef } from "react";
import { AppShell, useAutoMcpAppSize } from "@xmcp-dev/ui";

export default function Demo() {
  const rootRef = useRef<HTMLDivElement>(null);

  useAutoMcpAppSize(rootRef);

  return <AppShell ref={rootRef}>...</AppShell>;
}
```

## Tailwind Setup

Minimal example:

```css
@import "tailwindcss";
@import "@xmcp-dev/ui/styles.css";

@theme {
  --font-sans: "Geist", ui-sans-serif, sans-serif;
}
```

`@xmcp-dev/ui/styles.css` handles the Tailwind `@source` wiring for the package,
so you do not need to point Tailwind at package internals directly.

## When To Use Each Surface

Use `createRenderJsonTool()` when you want the normal schema-driven path.

Use `Rendered` when you want your own tool wrapper but still want the built-in
preview engine.

Use `App` when you want to own the rendering pipeline directly.

Use `useMcpApp()` when you are building a handwritten React MCP App that should
talk to the host.

If you are not using `@xmcp-dev/ui`, the host runtime is available from `xmcp`:

```ts
import { createMcpHostBridge } from "xmcp/host-bridge";
```

Use the `xmcp/host-bridge` import path for the MCP App host bridge.

## Related Docs

- [Custom Renderers](/Users/0xkoller/xmcp/xmcp/docs/ui/custom-renderers.md)
- [ui-showcase README](/Users/0xkoller/xmcp/xmcp/examples/ui-showcase/README.md)
