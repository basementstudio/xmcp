import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import {
  CancelledNotificationSchema,
  ProgressNotificationSchema,
  InitializedNotificationSchema,
  RootsListChangedNotificationSchema,
  NotificationSchema,
} from "@modelcontextprotocol/sdk/types";
import { z } from "zod";
import type {
  NotificationSubscription,
  NotificationExtra,
} from "@/types/notification";

export type NotificationFile = {
  default: NotificationSubscription;
};

// Map known methods → SDK Zod schemas
const KNOWN_SCHEMAS: Record<string, z.ZodType<any>> = {
  "notifications/cancelled": CancelledNotificationSchema,
  "notifications/progress": ProgressNotificationSchema,
  "notifications/initialized": InitializedNotificationSchema,
  "notifications/roots/list_changed": RootsListChangedNotificationSchema,
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
  notificationModules: Map<string, NotificationFile>
): void {
  // Group user handlers by method
  const handlersByMethod = new Map<
    string,
    Array<NotificationSubscription["handler"]>
  >();

  notificationModules.forEach((mod, path) => {
    const subscription = mod.default;
    if (!subscription || !subscription.__isNotificationSubscription) {
      console.warn(
        `[xmcp] Invalid notification subscription at ${path}. Expected default export from subscribe().`
      );
      return;
    }

    const { method, handler } = subscription;
    if (!handlersByMethod.has(method)) {
      handlersByMethod.set(method, []);
    }
    handlersByMethod.get(method)!.push(handler);
  });

  const lowLevelServer = server.server;

  handlersByMethod.forEach((handlers, method) => {
    const schema = KNOWN_SCHEMAS[method] ?? createGenericSchema(method);

    // For SDK internal methods, preserve the existing handler via wrap approach.
    // The SDK's Protocol stores handlers in _notificationHandlers Map keyed by method string.
    // We read the existing handler before overwriting to chain it with user handlers.
    let existingHandler:
      | ((notification: any) => void | Promise<void>)
      | undefined;
    if (SDK_INTERNAL_METHODS.has(method)) {
      existingHandler = (lowLevelServer as any)._notificationHandlers?.get(
        method
      );
      if (!existingHandler) {
        console.warn(
          `[xmcp] Could not find SDK internal handler for "${method}". ` +
            `SDK request cancellation/progress tracking may not work correctly.`
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

      // 2. Build extra context
      const extra: NotificationExtra = {
        signal: new AbortController().signal,
      };

      // 3. Run all user handlers concurrently with isolation
      const params = notification.params ?? {};
      const results = await Promise.allSettled(
        handlers.map((h) => Promise.resolve(h(params as any, extra)))
      );

      // 4. Log any handler errors
      results.forEach((result) => {
        if (result.status === "rejected") {
          console.error(
            `[xmcp] Notification handler error for "${method}":`,
            result.reason
          );
        }
      });
    });
  });
}
