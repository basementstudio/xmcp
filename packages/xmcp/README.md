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

## The TypeScript MCP Framework

`xmcp` is a framework for building and shipping MCP servers with TypeScript. Designed with DX in mind, it streamlines development and lowers the barrier to entry for anyone looking to create and deploy powerful tools on top of the Model Context Protocol ecosystem.

## Getting Started

Bootstrap your first `xmcp` application with:

```bash
npx create-xmcp-app@latest
```

or initialize `xmcp` on an existing Next.js or Express project with:

```bash
npx init-xmcp@latest
```

## Features

⊹ **File System Routing** - Tools and prompts are auto-registered from a `tools` and `prompts` directory\
⊹ **Hot Reloading** - Instant development feedback\
⊹ **Middlewares** - Toolkit for shipping authentication and custom middlewares\
⊹ **Extensible Configuration** - Customizable configuration for your MCP server\
⊹ **Deploy Anywhere** - Flexible deployment across any platform\
⊹ **Vercel Support** - Zero-configuration deployment with Vercel

## Learn more

⊹ Visit [xmcp.dev](https://xmcp.dev) to learn more about the project.\
⊹ Visit [xmcp.dev/docs](https://xmcp.dev/docs) to view the full documentation.

## Sampling From Tools

Tool handlers can request MCP sampling directly through `extra.sample()`.

```ts
import { z } from "zod";

export const schema = {
  topic: z.string(),
};

export default async ({ topic }, extra) => {
  const result = await extra.sample({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Write a concise summary about ${topic}.`,
        },
      },
    ],
    maxTokens: 300,
  });

  return {
    content: [
      {
        type: "text",
        text:
          result.content.type === "text"
            ? result.content.text
            : "The client did not return text content.",
      },
    ],
  };
};
```

For agentic flows, pass local xmcp tool names in `tools` or use `"all"`. xmcp will send the matching local tool definitions and handle the `tool_use -> tool_result -> continue` loop until the model finishes or `maxSteps` is reached.

```ts
const result = await extra.sample({
  messages: [
    {
      role: "user",
      content: {
        type: "text",
        text: "Research the current status and give me a short answer.",
      },
    },
  ],
  tools: ["search_docs", "fetch_page"],
  toolChoice: { mode: "auto" },
  maxTokens: 800,
  maxSteps: 6,
});
```

## Security

If you believe you have found a security vulnerability, we encourage you to let us know right away.

We will investigate all legitimate reports and do our best to quickly fix the problem.

Please report any vulnerabilities in our open source repositories to [security@xmcp.dev](mailto:security@xmcp.dev).
