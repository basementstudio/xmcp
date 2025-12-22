# MCP React Widgets with xmcp + Tailwind CSS

This project demonstrates how to create React widgets for MCP applications using xmcp with Tailwind CSS for styling.

## Metadata Example

```typescript
export const metadata: ToolMetadata = {
  name: "show-analytics",
  description: "Display analytics dashboard",
  _meta: {
    ui: {
      csp: {
        connectDomains: ["https://api.analytics.com"],
        resourceDomains: ["https://cdn.analytics.com"],
      },
      domain: "https://analytics-widget.example.com",
      prefersBorder: true,
    },
  },
};
```

## Getting Started

```bash
npm run dev
```

This will start the development server with HTTP transport enabled.

## Tailwind CSS

This template includes Tailwind CSS v4 with PostCSS for styling your widgets. The configuration is in `postcss.config.mjs` and global styles are in `globals.css`.
