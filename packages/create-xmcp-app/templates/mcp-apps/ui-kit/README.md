# MCP Apps with xmcp + @xmcp-dev/ui

This project demonstrates how to create MCP Apps using xmcp and the
`@xmcp-dev/ui` starter components.

## Included Tools

- `uiKitDemo`: handwritten React MCP App using `@xmcp-dev/ui`
- `renderJson`: schema-driven renderer for AppSchema JSON

## Getting Started

```bash
npm run dev
```

This will start the development server with HTTP transport enabled.

## Styling

This template includes Tailwind CSS v4, PostCSS, and
`@xmcp-dev/ui/styles.css`. The global stylesheet lives in `globals.css`.

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
