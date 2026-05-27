import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiConstant } from '../../core/constants/api.constant';
import { CampaignNotificationFilters, CampaignNotificationSearchResponse, NotificationDetailsResponse } from '../../managements/models/notifications.model';
import { ActivitySocketEvent } from '../../core/websocket/websocket.models';
import { API_ENGINE } from '../../core/stores/api/api.engine.interface';
import { CACHE_ENGINE } from '../../core/stores/cache/cache.engine';
import { buildNotificationsCacheKey, NOTIFICATIONS_TTL_MS } from '../caches/notifications.cache';
import { buildNotificationDetailCacheKey, NOTIFICATION_DETAIL_TTL_MS } from '../caches/notification-detail.cache';

@Injectable({ providedIn: 'root' })
export class NotificationService {
	private readonly apiEngine = inject(API_ENGINE);
	private readonly cacheEngine = inject(CACHE_ENGINE);

	getCampaignNotifications(
		campaignId: string | number,
		filters: CampaignNotificationFilters,
	): Observable<CampaignNotificationSearchResponse> {
		const cacheKey = buildNotificationsCacheKey(campaignId, filters);
		const cachedEntry = this.cacheEngine.get<CampaignNotificationSearchResponse>(cacheKey);

		if (this.cacheEngine.isFresh(cachedEntry, NOTIFICATIONS_TTL_MS)) {
			return new Observable((observer) => {
				observer.next(cachedEntry!.value);
				observer.complete();
			});
		}

		return new Observable((observer) => {
			this.apiEngine
				.get<CampaignNotificationSearchResponse>(ApiConstant.CAMPAIGNS.NOTIFICATIONS(campaignId), {
					params: {
						page: filters.page,
						size: filters.size,
						...(filters.channel && { channel: filters.channel }),
						...(filters.status && { status: filters.status }),
						...(filters.keyWord?.trim() && { keyword: filters.keyWord.trim() }),
					},
				})
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

	getNotificationDetails(notificationId: string | number): Observable<NotificationDetailsResponse> {
		throw new Error('Use NotificationDetailService.getNotificationDetails instead');
	}

	retryNotification(notificationId: string | number): Observable<void> {
		const cacheKey = buildNotificationDetailCacheKey(notificationId);
		this.cacheEngine.remove(cacheKey);
		return this.apiEngine.post<string>(
			ApiConstant.CAMPAIGNS.NOTIFICATION_RETRY(notificationId),
			{},
			{ responseType: 'text' },
		).pipe(map(() => void 0));
	}

	getRecentActivities(): Observable<ActivitySocketEvent[]> {
		return this.apiEngine.get<ActivitySocketEvent[]>(ApiConstant.CAMPAIGNS.ACTIVITIES_RECENT);
	}
}
