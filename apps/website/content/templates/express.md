---
name: "Express Starter"
description: "An Express MCP server using xmcp's adapter"
category: "framework"
tags: ["express", "adapter", "http"]
---

# xmcp Express Template

An Express server with xmcp mounted through the Express adapter.

## Features

- Express application with MCP mounted at `/mcp`
- File-based tool discovery from `src/tools/`
- Adapter build via `experimental.adapter: "express"`
- Type-safe tools with Zod schemas and `InferSchema`

## Getting Started

### 1. Create the project

```bash
npx create-xmcp-app --example express
```

### 2. Install & run

```bash
pnpm install
pnpm dev
```

The Express server starts at `http://localhost:3000`, and the MCP endpoint is available at `/mcp`.

## Project Structure

```
├── src/
│   ├── index.ts              # Express application entrypoint
│   └── tools/
│       └── greet.ts          # Example MCP tool
├── xmcp.config.ts            # xmcp adapter configuration
├── package.json
└── tsconfig.json
```

## MCP Endpoint

The MCP server is mounted through the generated adapter:

```typescript
import express from "express";
import { xmcpHandler } from "@xmcp/adapter";

const app = express();
const handleMcp = xmcpHandler as unknown as express.RequestHandler;

app.use(express.json({ limit: "10mb" }));
app.get("/mcp", handleMcp);
app.post("/mcp", handleMcp);
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
- [Express Documentation](https://expressjs.com/)
