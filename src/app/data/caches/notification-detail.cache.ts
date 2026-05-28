import { Injectable, inject } from '@angular/core';
import { CACHE_ENGINE } from '../../core/stores/cache/cache.engine';
import { NotificationDetailsResponse } from '../../managements/models/notifications.model';

export const NOTIFICATION_DETAIL_SCOPE = 'notification.detail';
export const NOTIFICATION_DETAIL_TTL_MS = 30 * 60 * 1000; // 30 minutes

@Injectable({ providedIn: 'root' })
export class NotificationDetailCache {
  private readonly cacheEngine = inject(CACHE_ENGINE);

  getNotificationDetails(notificationId: string | number): NotificationDetailsResponse | null {
    const cache = this.cacheEngine.get<NotificationDetailsResponse>(this.buildNotificationDetailCacheKey(notificationId));

    if (!this.cacheEngine.isFresh(cache, NOTIFICATION_DETAIL_TTL_MS)) {
      return null;
    }

    return cache!.value;
  }

  setNotificationDetails(notificationId: string | number, details: NotificationDetailsResponse): void {
    this.cacheEngine.set(this.buildNotificationDetailCacheKey(notificationId), details);
  }

  invalidateNotificationDetails(notificationId: string | number): void {
    this.cacheEngine.remove(this.buildNotificationDetailCacheKey(notificationId));
  }

  buildNotificationDetailCacheKey(notificationId: string | number): string {
    return `${NOTIFICATION_DETAIL_SCOPE}:${notificationId}`;
  }
}