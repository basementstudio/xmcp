
<div align="center">

  <a href="https://xmcp.dev">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://assets.basehub.com/bf7c3bb1/303b8a62053c9d86ca3b972b5597ab5c/x.png">
      <img alt="XMCP logo" src="https://assets.basehub.com/bf7c3bb1/303b8a62053c9d86ca3b972b5597ab5c/x.png" height="128">
    </picture>
  </a>
  <h1>xmcp</h1>

<a href="https://basement.studio"><img alt="xmcp logo" src="https://img.shields.io/badge/MADE%20BY%20basement.studio-000000.svg?style=for-the-badge&labelColor=000"></a>
<a href="https://www.npmjs.com/package/xmcp"><img alt="NPM version" src="https://img.shields.io/npm/v/xmcp.svg?style=for-the-badge&labelColor=000000"></a>
<a href="https://github.com/basementstudio/xmcp/blob/main/license.md"><img alt="License" src="https://img.shields.io/npm/l/xmcp.svg?style=for-the-badge&labelColor=000000"></a>


</div>
<div align="center">
<a href="https://vercel.com/open-source-program">
  <img alt="Vercel OSS Program" src="https://vercel.com/oss/program-badge-2026.svg" />
</a>
</div>

## The TypeScript MCP framework

Build and ship MCP servers with the code you already know. Give AI applications access to your tools, data, and workflows. Write TypeScript functions; `xmcp` handles the protocol, validation, and transport.

## Getting started

Create a new `xmcp` app:

```bash
npx create-xmcp-app@latest
```

Or add `xmcp` to an existing project:

```bash
npx init-xmcp@latest
```

A tool is a file. Export a schema, metadata, and a function, and `xmcp` registers it:

```typescript
// src/tools/greet.ts
import { z } from "zod";
import { type InferSchema } from "xmcp";

export const schema = {
  name: z.string().describe("The name of the user to greet"),
};

export const metadata = {
  name: "greet",
  description: "Greet the user",
};

export default async function greet({ name }: InferSchema<typeof schema>) {
  return `Hello, ${name}!`;
}
```

## Features

⊹ **File system routing** - Tools, prompts, and resources register automatically from their directories, with zero configuration\
⊹ **Middlewares** - Add authentication, logging, rate limits, or custom logic to every request\
⊹ **Transports** - Serve over HTTP or STDIO from the same code\
⊹ **Integrations** - Authentication with Better Auth, Clerk, Auth0, WorkOS, Descope, Scalekit and Supabase; monetization with Polar, Commet and x402\
⊹ **Adapters** - Run inside Next.js, Express, NestJS, Fastify, Hono, TanStack Start, Nuxt, SvelteKit, React Router or Astro\
⊹ **MCP Apps** - Ship interactive React widgets alongside your tools\
⊹ **Deploy anywhere** - Vercel, Cloudflare, Alpic, Replit, Railway, Render, or any Node.js host\
⊹ **Hot reloading** - Instant feedback while you develop

## Learn more

⊹ Visit [xmcp.dev](https://xmcp.dev) to learn more about the project.\
⊹ Read the [documentation](https://xmcp.dev/docs) for guides and API reference.\
⊹ Start from a [template](https://xmcp.dev/templates).

## Security

If you believe you have found a security vulnerability, we encourage you to let us know right away.

We will investigate all legitimate reports and do our best to quickly fix the problem.

Please report any vulnerabilities in our open source repositories to [security@xmcp.dev](mailto:security@xmcp.dev).
