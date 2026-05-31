import { Injectable } from '@angular/core';
import { Observable, of, map } from 'rxjs';
import { NotificationDetailService } from '../../data/services/notification-detail.service';
import { NotificationDetailsResponse } from '../dtos/notifications.dto';
import { NotificationDetailCache } from '../../data/caches/notification-detail.cache';
import { CacheDataSource } from '../../core/datasources/cache.datasource';
import { OptionCachePolicy } from '../../core/datasources/cache.datasource';

@Injectable()
export class NotificationDetailQuery {
	constructor(
		private readonly notificationDetailService: NotificationDetailService,
		private readonly notificationDetailCache: NotificationDetailCache,
		private readonly cacheDataSource: CacheDataSource,
	) {}

	loadNotificationDetails(notificationId: string | number, policy: OptionCachePolicy = 'cache-and-network'): Observable<NotificationDetailsResponse> {

		const key = this.notificationDetailCache.buildNotificationDetailCacheKey(notificationId);
		const cached = this.notificationDetailCache.peekNotificationDetails(notificationId);
		const network$ = this.notificationDetailService.getNotificationDetails(notificationId).pipe(
			map((response) => {
				this.notificationDetailCache.setNotificationDetails(notificationId, response);
				return { value: response, fetchedAt: Date.now() };
			}),
		);

		return this.cacheDataSource.query(key, cached, network$, policy).pipe(map((r) => r.value));
	}

	invalidateNotificationDetails(notificationId: string | number): void {
		this.notificationDetailCache.invalidateNotificationDetails(notificationId);
	}

	retryNotificationDevice(logId: string | number): Observable<void> {
		return this.notificationDetailService.retryNotificationDevice(logId);
	}
}
