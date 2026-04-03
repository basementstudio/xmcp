import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import {
  CancelledNotificationSchema,
  ProgressNotificationSchema,
  InitializedNotificationSchema,
  RootsListChangedNotificationSchema,
  TaskStatusNotificationSchema,
  NotificationSchema,
} from "@modelcontextprotocol/sdk/types";
import { z } from "zod";
import type { NotificationsConfig } from "@/types/notification";

// Map known methods → SDK Zod schemas
const KNOWN_SCHEMAS: Record<string, z.ZodType<any>> = {
  "notifications/cancelled": CancelledNotificationSchema,
  "notifications/progress": ProgressNotificationSchema,
  "notifications/initialized": InitializedNotificationSchema,
  "notifications/roots/list_changed": RootsListChangedNotificationSchema,
  "notifications/tasks/status": TaskStatusNotificationSchema,
};

// Methods where SDK has internal handlers that must be preserved
const SDK_INTERNAL_METHODS = new Set([
  "notifications/cancelled",
  "notifications/progress",
]);

function createGenericSchema(method: string) {
  return NotificationSchema.extend({
    method: z.literal(method),
  });
}

export function addNotificationsToServer(
  server: McpServer,
  config: NotificationsConfig | undefined
): void {
  if (!config || !config.__isNotificationsConfig) return;

  const lowLevelServer = server.server;

  for (const [method, handler] of Object.entries(config.handlers)) {
    if (!handler) continue;

    const schema = KNOWN_SCHEMAS[method] ?? createGenericSchema(method);

    // For SDK internal methods, preserve the existing handler via wrap approach.
    // Uses the SDK's private _notificationHandlers Map — if the SDK renames this
    // field, we throw at startup rather than silently losing cancellation/progress.
    let existingHandler:
      | ((notification: any) => void | Promise<void>)
      | undefined;
    if (SDK_INTERNAL_METHODS.has(method)) {
      const handlersMap = (lowLevelServer as any)._notificationHandlers;
      if (!handlersMap || typeof handlersMap.get !== "function") {
        throw new Error(
          `[xmcp] SDK internal structure changed: _notificationHandlers is missing. ` +
            `Cannot safely register "${method}" without breaking SDK behavior. ` +
            `Please update xmcp to a version compatible with this SDK.`
        );
      }
      existingHandler = handlersMap.get(method);
      if (!existingHandler) {
        throw new Error(
          `[xmcp] SDK internal handler for "${method}" not found. ` +
            `Registering a user handler would overwrite SDK behavior for request cancellation/progress tracking. ` +
            `Please update xmcp to a version compatible with this SDK.`
        );
      }
    }

    lowLevelServer.setNotificationHandler(schema, async (notification) => {
      // 1. Run SDK internal handler first (if preserved)
      if (existingHandler) {
        try {
          await existingHandler(notification);
        } catch (err) {
          console.error(
            `[xmcp] SDK notification handler error for "${method}":`,
            err
          );
        }
      }

      // 2. Run user handler with error isolation
      const params = notification.params ?? {};
      try {
        await handler(params as any);
      } catch (err) {
        console.error(
          `[xmcp] Notification handler error for "${method}":`,
          err
        );
      }
    });
  }
}
