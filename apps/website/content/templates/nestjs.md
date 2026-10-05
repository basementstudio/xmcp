---
name: "NestJS Starter"
description: "A NestJS MCP server using xmcp's adapter"
category: "framework"
tags: ["nestjs", "adapter", "http"]
---

# xmcp NestJS Template

A NestJS application with xmcp mounted through the NestJS adapter.

## Features

- NestJS application with MCP mounted at `/mcp`
- REST endpoints at `/health` and `/users`
- File-based tool discovery from `src/tools/`
- Adapter build via `experimental.adapter: "nestjs"`
- Shared in-memory users store used by both REST handlers and MCP tools

## Getting Started

### 1. Create the project

```bash
npx create-xmcp-app --example nestjs
```

### 2. Install & run

```bash
pnpm install
pnpm dev
```

The NestJS server starts at `http://localhost:3000`, and the MCP endpoint is available at `/mcp`.

## Project Structure

```
├── src/
│   ├── main.ts                  # NestJS bootstrap
│   ├── app.module.ts            # Root module
│   ├── health/
│   │   └── health.controller.ts # Health endpoint
│   ├── users/
│   │   ├── users.controller.ts  # Example REST API
│   │   ├── users.module.ts
│   │   ├── users.service.ts
│   │   └── users.store.ts       # Shared in-memory data store
│   ├── tools/
│   │   └── list-users.ts        # Example MCP tool
│   └── xmcp/
│       ├── xmcp.controller.ts   # /mcp route
│       ├── xmcp.filter.ts       # JSON-RPC error response filter
│       └── xmcp.module.ts
├── nest-cli.json
├── xmcp.config.ts
├── package.json
└── tsconfig.json
```

## MCP Endpoint

The MCP route is exposed through a regular NestJS controller:

```typescript
import { Controller, UseFilters } from "@nestjs/common";
import { XmcpController } from "@xmcp/adapter";
import { McpExceptionFilter } from "./xmcp.filter";

@Controller("mcp")
@UseFilters(McpExceptionFilter)
export class McpController extends XmcpController {}
```

## Adding Tools

Create a new `.ts` file in `src/tools/`. The tool is automatically discovered:

```typescript
import { type ToolMetadata } from "xmcp";

export const schema = {};

export const metadata: ToolMetadata = {
  name: "list-users",
  description: "List users from the NestJS app",
};

export default async function listUsers() {
  return "No users yet.";
}
```

## Build

```bash
pnpm build
pnpm start
```

## Learn More

- [xmcp Documentation](https://xmcp.dev/docs)
- [NestJS Documentation](https://docs.nestjs.com/)
