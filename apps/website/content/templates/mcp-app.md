---
name: "MCP App with React Widgets"
description: "An MCP server with React widgets and Tailwind CSS styling using MCP Apps"
category: "ui"
tags: ["react", "tailwind", "http"]
---

# xmcp MCP App Template

Build styled React widgets for MCP applications using Tailwind CSS.

## Features

- React component tools with Tailwind CSS v4 styling
- PostCSS configuration included
- CSP and domain metadata support for secure widget embedding
- HTTP transport
- Example tool: `weather` widget with Tailwind styling

## Getting Started

### 1. Create the project

```bash
npx create-xmcp-app --example mcp-app
```

### 2. Install & run

```bash
pnpm install
pnpm dev
```

The MCP server will start with HTTP transport at `http://localhost:3001`.

## Project Structure

```
├── src/
│   └── tools/
│       └── weather.tsx           # Weather widget with Tailwind
├── globals.css                   # Tailwind global styles
├── postcss.config.mjs            # PostCSS configuration
├── xmcp.config.ts                # Server configuration
├── package.json
└── tsconfig.json
```

## Creating Styled Tools

Create a `.tsx` file in `src/tools/` using Tailwind classes:

```tsx
import { z } from "zod";
import { type InferSchema, type ToolMetadata } from "xmcp";

export const schema = {
  city: z.string().describe("The city to look up"),
};

export const metadata: ToolMetadata = {
  name: "my-widget",
  description: "Display a styled widget",
  _meta: {
    ui: {
      csp: {
        connectDomains: ["https://api.example.com"],
        resourceDomains: ["https://cdn.example.com"],
      },
      domain: "https://widget.example.com",
      prefersBorder: true,
    },
  },
};

export default function MyWidget({ city }: InferSchema<typeof schema>) {
  return (
    <div className="rounded-lg bg-white p-4 shadow">
      <h2 className="text-lg font-bold">{city}</h2>
    </div>
  );
}
```

The `_meta.ui` field configures CSP policies and embedding behavior for your widget.

## Deploy

```bash
pnpm build
node dist/http.js
```

## Learn More

- [xmcp Documentation](https://xmcp.dev/docs)
