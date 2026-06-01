export const WS_TOPICS = {
  CAMPAIGNS: '/topic/campaigns',
  NOTIFICATIONS: '/topic/notifications',
  NOTIFICATION_DEVICE_STATUS: (notificationId: string | number) => `/topic/notifications/${notificationId}`,
  ACTIVITIES: '/topic/activities',
} as const;
