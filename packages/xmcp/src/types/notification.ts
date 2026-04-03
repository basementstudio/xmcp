// Known keys users write in defineNotifications()
export type NotificationKey =
  | "initialized"
  | "cancelled"
  | "progress"
  | "rootsListChanged"
  | "taskStatus";

// Full MCP method strings (used internally for SDK registration)
export type NotificationMethodMap = {
  initialized: "notifications/initialized";
  cancelled: "notifications/cancelled";
  progress: "notifications/progress";
  rootsListChanged: "notifications/roots/list_changed";
  taskStatus: "notifications/tasks/status";
};

// Task status values from the MCP spec
export type TaskStatus =
  | "working"
  | "input_required"
  | "completed"
  | "failed"
  | "cancelled";

// Typed params for each known key
export type NotificationParams = {
  initialized: Record<string, never>;
  cancelled: { requestId?: string | number; reason?: string };
  progress: {
    progressToken: string | number;
    progress: number;
    total?: number;
    message?: string;
  };
  rootsListChanged: Record<string, never>;
  taskStatus: {
    taskId: string;
    status: TaskStatus;
    statusMessage?: string;
    createdAt: string;
    lastUpdatedAt: string;
    ttl: number | null;
    pollInterval?: number;
  };
};

// Handler type for known keys — paramless notifications don't require params arg
export type NotificationHandler<K extends NotificationKey = NotificationKey> =
  NotificationParams[K] extends Record<string, never>
    ? () => void | Promise<void>
    : (params: NotificationParams[K]) => void | Promise<void>;

// Handler type for custom notification methods
export type CustomNotificationHandler = (
  params: Record<string, unknown>
) => void | Promise<void>;

// Return type of defineNotifications()
export interface NotificationsConfig {
  __isNotificationsConfig: true;
  handlers: Record<string, (...args: any[]) => void | Promise<void>>;
}
