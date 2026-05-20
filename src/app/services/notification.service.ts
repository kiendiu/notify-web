import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiConstant } from '../core/constants/api.constant';
import {
	CampaignNotificationFilters,
	CampaignNotificationSearchResponse,
	NotificationDetailsResponse,
} from '../management/models/notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationService {
	private readonly http = inject(HttpClient);

	getCampaignNotifications(
		campaignId: string | number,
		filters: CampaignNotificationFilters,
	): Observable<CampaignNotificationSearchResponse> {
		let params = new HttpParams()
			.set('page', filters.page)
			.set('size', filters.size);
		if (filters.channel) {
			params = params.set('channel', filters.channel);
		}
		if (filters.status) {
			params = params.set('status', filters.status);
		}
		if (filters.keyWord && filters.keyWord.trim()) {
			params = params.set('keyword', filters.keyWord.trim());
		}
		return this.http.get<CampaignNotificationSearchResponse>(
			ApiConstant.CAMPAIGNS.NOTIFICATIONS(campaignId),
			{ params },
		);
	}

	getNotificationDetails(notificationId: string | number): Observable<NotificationDetailsResponse> {
		return this.http.get<NotificationDetailsResponse>(
			ApiConstant.CAMPAIGNS.NOTIFICATION_DETAILS(notificationId),
		);
	}

	retryNotification(notificationId: string | number): Observable<void> {
		return this.http.post<void>(
			ApiConstant.CAMPAIGNS.NOTIFICATION_RETRY(notificationId),
			{},
		);
	}
}
