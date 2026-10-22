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

The tool description points models to `skill://xmcp-ui/schema-reference`. Add
the package-owned handler as a normal xmcp resource:

```ts
export {
  schemaReferenceResourceHandler as default,
  schemaReferenceResourceMetadata as metadata,
} from "@xmcp-dev/ui";
```

Save that file at
`src/resources/(skill)/xmcp-ui/schema-reference.ts`. The `--ui-kit` template
and `xmcp-ui init` command both create it automatically.

## Host-Backed Schema Apps

Schema-driven apps default to `transportMode: "auto"`, preferring the MCP App
host and falling back to direct HTTP in standalone previews. To require the
host, use:

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

For model-generated schemas, use `serverUrl` to pin the endpoint and
`allowedOrigins` to reject any effective URL outside your allowlist:

```tsx
const renderJsonTool = createRenderJsonTool({
  serverUrl: "https://mcp.example.com",
  allowedOrigins: ["https://mcp.example.com"],
});
```

Only HTTP(S) MCP URLs without embedded credentials are accepted. Redirects are rejected. Invalid, reserved, and unsafe model-provided
headers are dropped before requests are sent.

Direct HTTP uses the MCP SDK to negotiate modern or legacy servers and correlate
JSON and SSE responses. Connections are shared within an app and closed when
it unmounts or switches to the host. Stateless servers remain stateless; when a
server issues a session, the client reuses it and requests its deletion during
cleanup. If a session expires, the failed tool call is not replayed: the next
user action opens a new connection.

## Adding shadcn components

The `create-xmcp-app --ui-kit` starter is configured for the shadcn CLI. From
its project directory, add the components you want:

```bash
pnpm dlx shadcn@latest add button card dialog
```

You can use the generated components in handwritten React tools:

```tsx
import { AppShell, useMcpApp } from "@xmcp-dev/ui";
import { Button } from "#components/ui/button";

export default function MyApp() {
  const { openLink } = useMcpApp();
  return (
    <AppShell theme="light">
      <Button onClick={() => openLink("https://xmcp.dev/docs")}>
        Open docs
      </Button>
    </AppShell>
  );
}
```

`components.json` points to `src/components/ui`, with native `#components`,
`#lib`, and `#hooks` package imports. The starter enables TypeScript's bundler
resolution and includes `src/lib/utils.ts`, which re-exports the kit's `cn`.
The CLI installs dependencies required by each component.

The root stylesheet imports `@xmcp-dev/ui/shadcn.css` and `tw-animate-css`.
The optional shadcn stylesheet maps Tailwind v4's semantic utilities, such as
`bg-primary` and `text-foreground`, to the kit's HSL theme tokens. Keep this
stylesheet when adding components; there is no need to run `shadcn init` again.

`AppShell` supplies its theme tokens and dark-mode class to nested components.
For dialogs and other components that render portals under `document.body`,
keep the document's `dark` class in sync with the `AppShell` theme as well.
The stylesheet supplies light and dark defaults at the document level.

The existing-project `xmcp-ui init` command adds the UI kit files; configuring
shadcn in an existing project follows the [manual installation guide](https://ui.shadcn.com/docs/installation/manual).
Use the same optional stylesheet to keep the kit's theme tokens compatible.

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

## Existing Project Init

After installing the package in an existing xmcp project, scaffold the starter
files explicitly:

```bash
npx @xmcp-dev/ui init
```

The init command adds `globals.css`, `postcss.config.mjs`, a `renderJson`
tool, the `skill://xmcp-ui/schema-reference` resource, and a small handwritten
React MCP App. It updates missing dependencies in `package.json`, but it does
not run install for you.

Useful options:

- `--dry-run` to preview changes
- `--force` to replace existing starter files

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

- [UI rendering](https://xmcp.dev/docs/guides/ui-rendering)
- [ui-showcase README](../../examples/ui-showcase/README.md)
