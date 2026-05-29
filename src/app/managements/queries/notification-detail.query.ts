import { Injectable } from '@angular/core';
import { Observable, of, map } from 'rxjs';
import { NotificationDetailService } from '../../data/services/notification-detail.service';
import { NotificationDetailsResponse } from '../dtos/notifications.dto';
import { NotificationDetailCache } from '../../data/caches/notification-detail.cache';

@Injectable()
export class NotificationDetailQuery {
	constructor(
		private readonly notificationDetailService: NotificationDetailService,
		private readonly notificationDetailCache: NotificationDetailCache,
	) {}

	loadNotificationDetails(notificationId: string | number): Observable<NotificationDetailsResponse> {
		const cachedDetails = this.notificationDetailCache.getNotificationDetails(notificationId);
		if (cachedDetails) {
			return of(cachedDetails);
		}

		return this.notificationDetailService.getNotificationDetails(notificationId).pipe(
			map((response) => {
				this.notificationDetailCache.setNotificationDetails(notificationId, response);
				return response;
			}),
		);
	}

	invalidateNotificationDetails(notificationId: string | number): void {
		this.notificationDetailCache.invalidateNotificationDetails(notificationId);
	}

	retryNotificationDevice(logId: string | number): Observable<void> {
		return this.notificationDetailService.retryNotificationDevice(logId);
	}
}
