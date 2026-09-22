---
name: "Next.js Starter"
description: "A full-stack MCP server built with Next.js and xmcp"
category: "framework"
tags: ["nextjs", "http"]
---

# xmcp Next.js Template

A full-stack MCP server built with Next.js, exposing tools via the `/mcp` route.

## Features

- Next.js app with MCP endpoint at `/mcp`
- File-based tool discovery from `src/tools/`
- Concurrent dev server (xmcp + Next.js)
- Example tools: `greet` (sync) and `weather` (async with external API)
- Ready for authentication via `withAuth`

## Getting Started

### 1. Create the project

```bash
npx create-xmcp-app --example nextjs
```

### 2. Install & run

```bash
pnpm install
pnpm dev
```

This starts both the xmcp dev server and Next.js dev server concurrently. Open [http://localhost:3000](http://localhost:3000) to see your app, and the MCP endpoint will be available at `/mcp`.

## Project Structure

```
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── mcp/
│       └── route.ts              # MCP endpoint handler
├── src/
│   └── tools/
│       ├── greet.ts              # Simple sync tool
│       └── weather.ts            # Async tool with API call
├── components/
│   └── ui/
│       └── button.tsx
├── lib/
│   └── cn.ts
├── xmcp.config.ts                # Server configuration
└── package.json
```

## MCP Endpoint

The MCP server is exposed at `/mcp` via the Next.js adapter in `app/mcp/route.ts`:

```typescript
import { xmcpHandler } from "@xmcp/adapter";

export { xmcpHandler as GET, xmcpHandler as POST };
```

## Adding Tools

Create a new `.ts` file in `src/tools/`. The tool is automatically discovered:

```typescript
import { z } from "zod";
import { type InferSchema, type ToolMetadata } from "xmcp";

export const schema = {
  name: z.string().describe("The name of the user to greet"),
};

export const metadata: ToolMetadata = {
  name: "greet",
  description: "Greet the user",
};

export default function greet({ name }: InferSchema<typeof schema>) {
  return `Hello, ${name}!`;
}
```

## Authentication

Add authentication to your MCP server using the `withAuth` function. See the [xmcp Next.js documentation](https://xmcp.dev/docs/adapters/nextjs) for details.

## Deploy

```bash
pnpm build
```

Deploy to Vercel or any Node.js hosting platform.

## Learn More

- [xmcp Documentation](https://xmcp.dev/docs)
- [xmcp Next.js Adapter](https://xmcp.dev/docs/adapters/nextjs)
- [Next.js Documentation](https://nextjs.org/docs)
