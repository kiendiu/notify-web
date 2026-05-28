import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Endpoint } from '../../core/constants/endpoint';
import { CampaignNotificationFilters, CampaignNotificationSearchResponse, NotificationDetailsResponse } from '../../managements/models/notifications.model';
import { ActivitySocketEvent } from '../../core/websocket/websocket.models';
import { API_ENGINE } from '../../core/stores/api/api.engine.interface';

@Injectable({ providedIn: 'root' })
export class NotificationService {
	private readonly apiEngine = inject(API_ENGINE);

	getCampaignNotifications(
		campaignId: string | number,
		filters: CampaignNotificationFilters,
	): Observable<CampaignNotificationSearchResponse> {
		return this.apiEngine.get<CampaignNotificationSearchResponse>(Endpoint.CAMPAIGNS.NOTIFICATIONS(campaignId), {
			params: {
				page: filters.page,
				size: filters.size,
				...(filters.channel && { channel: filters.channel }),
				...(filters.status && { status: filters.status }),
				...(filters.keyWord?.trim() && { keyword: filters.keyWord.trim() }),
			},
		});
	}

	getNotificationDetails(notificationId: string | number): Observable<NotificationDetailsResponse> {
		throw new Error('Use NotificationDetailService.getNotificationDetails instead');
	}

	retryNotification(notificationId: string | number): Observable<void> {
		return this.apiEngine.post<string>(
			Endpoint.CAMPAIGNS.NOTIFICATION_RETRY(notificationId),
			{},
			{ responseType: 'text' },
		).pipe(map(() => void 0));
	}

	getRecentActivities(): Observable<ActivitySocketEvent[]> {
		return this.apiEngine.get<ActivitySocketEvent[]>(Endpoint.CAMPAIGNS.ACTIVITIES_RECENT);
	}
}
