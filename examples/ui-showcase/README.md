# ui-showcase

This example shows the default `@xmcp-dev/ui` path.

The `render-json` tool is intentionally tiny:

- it uses `createRenderJsonTool()`
- the package owns the long tool description
- the package owns the preview behavior
- the LLM only passes `schemaJson`

Relevant files:

- [render-json.tsx](/Users/0xkoller/xmcp/xmcp/examples/ui-showcase/src/tools/render-json.tsx)
- [globals.css](/Users/0xkoller/xmcp/xmcp/examples/ui-showcase/src/globals.css)

What this example demonstrates:

- minimal local tool setup
- package-owned stylesheet import
- package-owned theme presets and preview behavior

For the quick start and default path:

- [packages/ui/README.md](/Users/0xkoller/xmcp/xmcp/packages/ui/README.md)

For deep customization:

- [Custom Renderers](/Users/0xkoller/xmcp/xmcp/docs/ui/custom-renderers.md)
