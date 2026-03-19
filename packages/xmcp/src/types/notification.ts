// Known MCP client→server notification methods
export type KnownNotificationMethod =
  | "notifications/cancelled"
  | "notifications/progress"
  | "notifications/initialized"
  | "notifications/roots/list_changed";

// Open type: known methods + arbitrary strings
export type NotificationMethod = KnownNotificationMethod | (string & {});

// Typed params for known methods
export type KnownNotificationParams = {
  "notifications/cancelled": { requestId: string | number; reason?: string };
  "notifications/progress": {
    progressToken: string | number;
    progress: number;
    total?: number;
    message?: string;
  };
  "notifications/initialized": Record<string, never>;
  "notifications/roots/list_changed": Record<string, never>;
};

// Resolve params: known → typed, unknown → Record<string, unknown>
export type NotificationParamsFor<M extends string> =
  M extends keyof KnownNotificationParams
    ? KnownNotificationParams[M]
    : Record<string, unknown>;

// Extra context available at notification time.
// Unlike tool handlers, notification handlers don't have access to
// sendNotification/sendRequest/authInfo since notifications are
// dispatched outside the request-response lifecycle.
export interface NotificationExtra {
  /** An abort signal for the notification handler */
  signal: AbortSignal;
}

// Handler callback type
export type NotificationHandler<M extends string = string> = (
  params: NotificationParamsFor<M>,
  extra: NotificationExtra
) => void | Promise<void>;

// Return type of subscribe()
export interface NotificationSubscription<M extends string = string> {
  __isNotificationSubscription: true;
  method: M;
  handler: NotificationHandler<M>;
}
