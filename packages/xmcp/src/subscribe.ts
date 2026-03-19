import type {
  NotificationMethod,
  NotificationHandler,
  NotificationSubscription,
} from "./types/notification";

export function subscribe<M extends NotificationMethod>(
  method: M,
  handler: NotificationHandler<M>
): NotificationSubscription<M> {
  return {
    __isNotificationSubscription: true,
    method,
    handler,
  };
}
