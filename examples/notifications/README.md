# Notifications

Handle MCP client notifications using a single setup file.

## What are MCP notifications?

In MCP, notifications are **one-way messages** from client to server (or server to client). Unlike requests, they don't expect a response. The client-to-server notifications are:

| Key                | MCP Method                            | When it fires                                   |
| ------------------ | ------------------------------------- | ----------------------------------------------- |
| `initialized`      | `notifications/initialized`           | Client completed the initialization handshake   |
| `cancelled`        | `notifications/cancelled`             | Client cancelled an in-flight request            |
| `progress`         | `notifications/progress`              | Client sent a progress update                    |
| `rootsListChanged` | `notifications/roots/list_changed`    | Client's root URIs changed                      |
| `taskStatus`       | `notifications/tasks/status`          | Task status changed                              |

## How it works

Create a `src/notifications.ts` file that exports a `defineNotifications()` call:

```ts
// src/notifications.ts
import { defineNotifications } from "xmcp";

export default defineNotifications({
  initialized: async () => {
    console.log("Client initialized");
  },
  cancelled: async (params) => {
    console.log("Cancelled:", params.requestId);
  },
  progress: async (params) => {
    console.log("Progress:", params.progress);
  },
  rootsListChanged: async () => {
    console.log("Roots changed");
  },
  taskStatus: async (params) => {
    console.log(`Task ${params.taskId}: ${params.status}`);
  },
});
```

xmcp discovers this file at build time (similar to `src/middleware.ts`) and registers the handlers on the MCP server at runtime. Keys are mapped to full MCP method names automatically.

### Handler signature

```ts
defineNotifications({
  // Paramless, no arguments needed
  initialized: async () => { ... },

  // With params, fully typed
  cancelled: async (params) => {
    params.requestId // string | number | undefined
    params.reason    // string | undefined
  },

  // Custom methods, params is Record<string, unknown>
  "custom/my-event": async (params) => { ... },
});
```

- **Known keys** get fully typed `params` and autocomplete.
- **Custom methods** (any string) are also supported. `params` is typed as `Record<string, unknown>`.
- **Error isolation**: if a handler throws, it's caught and logged without affecting the server.

### SDK handler preservation

For `cancelled` and `progress`, the MCP SDK already has internal handlers (for aborting requests and tracking progress). Your handlers run **alongside** them and don't replace the SDK's built-in behavior.

## Project structure

```
src/
├── notifications.ts       # All notification handlers in one place
└── tools/
    └── ping.ts            # Simple ping tool
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
[notification] Roots list changed
[notification] Request req-42 cancelled: User clicked cancel
[notification] Progress (75%): Almost done
[notification] Task task-1: completed
```
