export const NOTIFICATION_DETAIL_SCOPE = 'notification.detail';
export const NOTIFICATION_DETAIL_TTL_MS = 30 * 60 * 1000; // 30 minutes

export function buildNotificationDetailCacheKey(notificationId: string | number): string {
  return `${NOTIFICATION_DETAIL_SCOPE}:${notificationId}`;
}