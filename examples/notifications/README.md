# Notifications

Subscribe to MCP client notifications using xmcp's file-based convention.

## What are MCP notifications?

In MCP, notifications are **one-way messages** from client to server (or server to client). Unlike requests, they don't expect a response. Common client-to-server notifications include:

| Notification                         | When it fires                                   |
| ------------------------------------ | ----------------------------------------------- |
| `notifications/initialized`          | Client completed the initialization handshake   |
| `notifications/roots/list_changed`   | Client's root URIs changed                      |
| `notifications/cancelled`            | Client cancelled an in-flight request            |
| `notifications/progress`             | Client sent a progress update                    |

## How it works

Create files in `src/notifications/` that export a `subscribe()` call:

```ts
// src/notifications/roots-changed.ts
import { subscribe } from "xmcp";

export default subscribe("notifications/roots/list_changed", async () => {
  console.log("Roots list changed!");
});
```

xmcp discovers these files at build time (just like tools, prompts, and resources) and registers the handlers on the MCP server at runtime.

### Handler signature

```ts
subscribe(method, async (params, extra) => {
  // params — typed based on the notification method
  // extra  — { signal: AbortSignal }
});
```

- **Known methods** (`notifications/cancelled`, `notifications/progress`, etc.) get fully typed `params`.
- **Custom methods** are also supported — `params` is typed as `Record<string, unknown>`.
- **Multiple files** can subscribe to the same notification. All handlers run concurrently.
- **Error isolation** — if one handler throws, others still execute.

### SDK handler preservation

For `notifications/cancelled` and `notifications/progress`, the MCP SDK already has internal handlers (for aborting requests and tracking progress). Your handlers run **alongside** them — they don't replace the SDK's built-in behavior.

## Project structure

```
src/
├── notifications/
│   ├── roots-changed.ts    # Reacts to root URI changes
│   ├── on-cancel.ts        # Logs cancelled requests
│   ├── on-progress.ts      # Logs progress updates
│   └── on-initialized.ts   # Logs session initialization
└── tools/
    └── ping.ts             # Simple ping tool
```

## Running the example

### 1. Start the server

```bash
pnpm dev
```

### 2. Send test notifications

In a second terminal:

```bash
pnpm run test:notifications
```

If the server started on a different port (check the server terminal output), set the URL:

```bash
SERVER_URL=http://localhost:3002/mcp pnpm run test:notifications
```

### 3. Check the server terminal

You should see output like:

```
[notification] Client session initialized
[notification] Roots list changed — workspace context may need updating
[notification] Request req-42 was cancelled: User clicked cancel
[notification] Progress (75%): Almost done
```

## Configuration

The notifications directory path is configurable in `xmcp.config.ts`:

```ts
const config: XmcpConfig = {
  paths: {
    notifications: "src/notifications",  // default
    // notifications: "src/events",      // custom path
    // notifications: false,             // disable
  },
};
```
