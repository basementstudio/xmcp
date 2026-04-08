# `ui-showcase`

This example is an MCP Apps showcase for `xmcp` and `@xmcp-dev/ui`.

The example app is organized around a small set of realistic MCP App patterns:

- `showcase` for the landing page and learning path
- `liveToolDemo` for an ops-console style tool-calling app
- `hostThemeDemo` for host context, view modes, and auto-size behavior
- `resourceComposerDemo` for `resources/read`, `ui/message`, and `ui/update-model-context`
- `schemaAppDemo` for schema-driven UI running with host-backed transport
- `renderJson` as the small raw schema reference tool

The showcase includes a focused set of tools and one MCP resource used by the
resource/composer demo.

## What This Example Demonstrates

- handwritten React MCP Apps with `useMcpApp()`
- schema-driven apps with `createRenderJsonTool()`
- host-backed transport for schema-driven rendering
- host-aware behavior like display modes, host context, and size reporting
- resource reads, host messaging, and model-context updates

## Relevant Files

- [showcase.tsx](/Users/0xkoller/xmcp/xmcp/examples/ui-showcase/src/tools/showcase.tsx)
- [live-tool-demo.tsx](/Users/0xkoller/xmcp/xmcp/examples/ui-showcase/src/tools/live-tool-demo.tsx)
- [host-theme-demo.tsx](/Users/0xkoller/xmcp/xmcp/examples/ui-showcase/src/tools/host-theme-demo.tsx)
- [resource-composer-demo.tsx](/Users/0xkoller/xmcp/xmcp/examples/ui-showcase/src/tools/resource-composer-demo.tsx)
- [schema-app-demo.tsx](/Users/0xkoller/xmcp/xmcp/examples/ui-showcase/src/tools/schema-app-demo.tsx)
- [render-json.tsx](/Users/0xkoller/xmcp/xmcp/examples/ui-showcase/src/tools/render-json.tsx)
- [mcp-app-playbook.ts](/Users/0xkoller/xmcp/xmcp/examples/ui-showcase/src/resources/(docs)/mcp-app-playbook.ts)
- [globals.css](/Users/0xkoller/xmcp/xmcp/examples/ui-showcase/src/globals.css)

## Start Here

If you want the intended tour, open the tools in this order:

1. `showcase`
2. `liveToolDemo`
3. `hostThemeDemo`
4. `resourceComposerDemo`
5. `schemaAppDemo`

Use `renderJson` afterward when you want a smaller schema-driven reference.

## Related Docs

- [packages/ui/README.md](/Users/0xkoller/xmcp/xmcp/packages/ui/README.md)
- [Custom Renderers](/Users/0xkoller/xmcp/xmcp/docs/ui/custom-renderers.md)
