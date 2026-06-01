import { Inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Endpoint } from '../../core/constants/endpoint';
import { CampaignNotificationFilters } from '../../managements/params/notifications.params';
import { CampaignNotificationSearchResponse, NotificationDetailsResponse } from '../../managements/dtos/notifications.dto';
import { ActivitySocketEvent } from '../../core/websocket/websocket.models';
import { API_ENGINE, ApiEngine } from '../../core/stores/api/api.engine.interface';

@Injectable()
export class NotificationService {
	constructor(@Inject(API_ENGINE) private readonly apiEngine: ApiEngine) {}

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
