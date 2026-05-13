// Task: NSF02 | Path: backend/packages/notifications-system-flow/src/services/NotificationDispatcher.ts

/**
 * Dispatches composed notifications through the delivery gateway.
 * Stub for alpha skeleton: logs dispatch. Actual push/in-app delivery
 * (Firebase/APNs + in-app queue) is an implementation detail for later phases.
 */
export class NotificationDispatcher {
  public async dispatch(notification: {
    notificationId: string;
    recipientAccountId: string;
    notificationTitle: string;
    notificationMessage: string;
    notificationChannels: string;
  }): Promise<void> {
    console.log(
      `[NSF-Dispatch] Notification dispatched: id=${notification.notificationId}, ` +
        `recipient=${notification.recipientAccountId}, ` +
        `channel=${notification.notificationChannels}, ` +
        `title="${notification.notificationTitle}"`
    );
  }
}
