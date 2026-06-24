import type {
  NotificationKey,
  NotificationHandler,
  NotificationMethodMap,
  NotificationsConfig,
  CustomNotificationHandler,
} from "./types/notification";

const METHOD_PREFIX: NotificationMethodMap = {
  initialized: "notifications/initialized",
  cancelled: "notifications/cancelled",
  progress: "notifications/progress",
  rootsListChanged: "notifications/roots/list_changed",
  taskStatus: "notifications/tasks/status",
};

// Resolves the handler type: known keys get typed params, custom strings get Record<string, unknown>
type ResolveHandler<K extends string> = K extends NotificationKey
  ? NotificationHandler<K>
  : CustomNotificationHandler;

type HandlersInput<K extends string> = {
  [M in K]: ResolveHandler<M>;
};

export function defineNotifications<
  K extends NotificationKey | (string & {}),
>(handlers: HandlersInput<K>): NotificationsConfig {
  const mapped: Record<string, any> = {};
  for (const [key, handler] of Object.entries(handlers)) {
    if (!handler) continue;
    // Known keys get mapped to full MCP method strings, custom keys pass through
    const fullMethod =
      METHOD_PREFIX[key as keyof NotificationMethodMap] ?? key;
    mapped[fullMethod] = handler;
  }

  return {
    __isNotificationsConfig: true,
    handlers: mapped,
  };
}
