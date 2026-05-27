import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { NotificationDetailService } from '../../data/services/notification-detail.service';
import { NotificationDetailsResponse } from '../models/notifications.model';

@Injectable({ providedIn: 'root' })
export class NotificationDetailQuery {
	private readonly notificationDetailService = inject(NotificationDetailService);

	loadNotificationDetails(notificationId: string | number): Observable<NotificationDetailsResponse> {
		return this.notificationDetailService.getNotificationDetails(notificationId);
	}
}
