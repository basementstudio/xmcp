---
name: "xmcp TypeScript Starter"
description: "Baseline xmcp template with typed tools, prompts, and resources using HTTP transport."
category: "http"
tags: ["typescript", "http"]
---

# xmcp TypeScript Template

A minimal MCP server with tools, prompts, and resources using TypeScript and HTTP transport.

## Features

- File-based routing for tools, prompts, and resources
- Zod schema validation for all inputs
- Type-safe with `InferSchema` utility
- HTTP and STDIO transport support
- Auto-discovery of tools, prompts, and resources from directories

## Getting Started

### 1. Create the project

```bash
npx create-xmcp-app --example typescript
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
│   ├── tools/
│   │   └── greet.ts              # Example tool
│   ├── prompts/
│   │   └── review-code.ts        # Example prompt
│   └── resources/
│       ├── (config)/app.ts       # Static resource
│       └── (users)/[userId]/     # Dynamic resource with URI params
│           └── index.ts
├── xmcp.config.ts                # Server configuration
├── package.json
└── tsconfig.json
```

## Adding Tools

Create a new `.ts` file in `src/tools/`:

```typescript
import { z } from "zod";
import { type InferSchema, type ToolMetadata } from "xmcp";

export const schema = {
  name: z.string().describe("The name of the user to greet"),
};

export const metadata: ToolMetadata = {
  name: "greet",
  description: "Greet the user",
  annotations: {
    title: "Greet the user",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

export default function greet({ name }: InferSchema<typeof schema>) {
  return `Hello, ${name}!`;
}
```

The tool is automatically discovered and registered.

## Adding Prompts

Create a new `.ts` file in `src/prompts/`:

```typescript
import { z } from "zod";
import { type InferSchema, type PromptMetadata } from "xmcp";

export const schema = {
  code: z.string().describe("The code to review"),
};

export const metadata: PromptMetadata = {
  name: "review-code",
  title: "Review Code",
  description: "Review code for best practices and potential issues",
  role: "user",
};

export default function reviewCode({ code }: InferSchema<typeof schema>) {
  return `Please review this code: ${code}`;
}
```

## Adding Resources

Create a new `.ts` file in `src/resources/`. Use folder structure to define the URI — for example, `(users)/[userId]/profile.ts` maps to `users://{userId}/profile`.

```typescript
import { z } from "zod";
import { type ResourceMetadata, type InferSchema } from "xmcp";

export const schema = {
  userId: z.string().describe("The ID of the user"),
};

export const metadata: ResourceMetadata = {
  name: "user-profile",
  title: "User Profile",
  description: "User profile information",
};

export default function handler({ userId }: InferSchema<typeof schema>) {
  return `Profile data for user ${userId}`;
}
```

## Deploy

Build for production:

```bash
pnpm build
```

Run the compiled server:

```bash
# HTTP transport
node dist/http.js

# STDIO transport
node dist/stdio.js
```

## Learn More

- [xmcp Documentation](https://xmcp.dev/docs)
