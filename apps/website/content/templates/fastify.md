---
name: "Fastify Starter"
description: "A Fastify MCP server using xmcp's adapter"
category: "framework"
tags: ["fastify", "adapter", "http"]
---

# xmcp Fastify Template

A Fastify server with xmcp mounted through the Fastify adapter.

## Features

- Fastify application with MCP mounted at `/mcp`
- File-based tool discovery from `src/tools/`
- Adapter build via `experimental.adapter: "fastify"`
- Type-safe tools with Zod schemas and `InferSchema`

## Getting Started

### 1. Create the project

```bash
npx create-xmcp-app --example fastify
```

### 2. Install & run

```bash
pnpm install
pnpm dev
```

The Fastify server starts at `http://localhost:3000`, and the MCP endpoint is available at `/mcp`.

## Project Structure

```
├── src/
│   ├── index.ts              # Fastify application entrypoint
│   └── tools/
│       └── greet.ts          # Example MCP tool
├── xmcp.config.ts            # xmcp adapter configuration
├── package.json
└── tsconfig.json
```

## MCP Endpoint

The MCP server is mounted through the generated adapter:

```typescript
import Fastify from "fastify";
import { xmcpHandler } from "@xmcp/adapter";

const app = Fastify();

app.post("/mcp", xmcpHandler);
app.get("/mcp", xmcpHandler);
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

export default async function greet({ name }: InferSchema<typeof schema>) {
  return `Hello, ${name}!`;
}
```

## Build

```bash
pnpm build
pnpm start
```

## Learn More

- [xmcp Documentation](https://xmcp.dev/docs)
- [Fastify Documentation](https://fastify.dev/docs/latest/)
