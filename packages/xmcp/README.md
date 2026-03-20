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

## Troubleshooting

### Default export required

`xmcp` expects each file in `tools` to export a callable `default` handler.

```ts
// tools/greet.ts
export default function greet() {
  return "hello";
}
```

If a file is empty, missing a `default` export, or exports a non-function as default, `xmcp` will:
- print a friendly warning with the file path
- skip only that file
- continue starting the server

Startup also prints per-type summaries like:
- `1 tools skipped due to empty/malformed files or import errors.`

For real import/syntax failures, `xmcp` keeps the full error output/stack trace to help debugging.

## Security

If you believe you have found a security vulnerability, we encourage you to let us know right away.

We will investigate all legitimate reports and do our best to quickly fix the problem.

Please report any vulnerabilities in our open source repositories to [security@xmcp.dev](mailto:security@xmcp.dev).
