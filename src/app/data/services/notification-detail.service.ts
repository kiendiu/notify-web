import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiConstant } from '../../core/constants/api.constant';
import { NotificationDetailsResponse } from '../../managements/models/notifications.model';
import { API_ENGINE } from '../../core/stores/api/api.engine.interface';
import { CACHE_ENGINE } from '../../core/stores/cache/cache.engine';
import { buildNotificationDetailCacheKey, NOTIFICATION_DETAIL_TTL_MS } from '../caches/notification-detail.cache';

@Injectable({ providedIn: 'root' })
export class NotificationDetailService {
  private readonly apiEngine = inject(API_ENGINE);
  private readonly cacheEngine = inject(CACHE_ENGINE);

  getNotificationDetails(notificationId: string | number): Observable<NotificationDetailsResponse> {
    const cacheKey = buildNotificationDetailCacheKey(notificationId);
    const cachedEntry = this.cacheEngine.get<NotificationDetailsResponse>(cacheKey);

    if (this.cacheEngine.isFresh(cachedEntry, NOTIFICATION_DETAIL_TTL_MS)) {
      return new Observable((observer) => {
        observer.next(cachedEntry!.value);
        observer.complete();
      });
    }

    return new Observable((observer) => {
      this.apiEngine
        .get<NotificationDetailsResponse>(ApiConstant.CAMPAIGNS.NOTIFICATION_DETAILS(notificationId))
        .subscribe({
          next: (response) => {
            this.cacheEngine.set(cacheKey, response);
            observer.next(response);
            observer.complete();
          },
          error: (err) => observer.error(err),
        });
    });
  }
}
