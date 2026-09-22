---
name: "React Widgets"
description: "An MCP server with interactive React component widgets"
category: "chatgpt"
tags: ["react", "widgets", "http"]
---

# xmcp React Widgets Template

Build interactive ChatGPT widgets using React and xmcp.

## Features

- React component tools rendered as interactive widgets in ChatGPT
- Server-side rendering automatically enabled for React tools
- TypeScript support with Zod schema validation
- HTTP transport
- Example tools: `counter` (state management) and `weather` (external API)

## Getting Started

### 1. Create the project

```bash
npx create-xmcp-app --example react
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
│       ├── counter.tsx           # Interactive counter widget
│       └── weather.tsx           # Weather widget with API data
├── xmcp.config.ts                # Server configuration
├── package.json
└── tsconfig.json
```

## Creating Widget Tools

Create a `.tsx` file in `src/tools/` that exports a React component as the default:

```tsx
import { z } from "zod";
import { type InferSchema, type ToolMetadata } from "xmcp";

export const schema = {
  name: z.string().describe("The name to display"),
};

export const metadata: ToolMetadata = {
  name: "my-widget",
  description: "Display an interactive widget",
};

export default function MyWidget({ name }: InferSchema<typeof schema>) {
  return <div>Hello, {name}!</div>;
}
```

The tool is automatically discovered and rendered as a widget in ChatGPT.

## Deploy

```bash
pnpm build
node dist/http.js
```

## Learn More

- [xmcp Documentation](https://xmcp.dev/docs)
- [ChatGPT Widgets Guide](https://xmcp.dev/docs/integrations/chatgpt)
