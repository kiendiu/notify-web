import { Injectable } from '@angular/core';
import { Observable, map, of, tap } from 'rxjs';
import { NotificationService } from '../../data/services/notifications.service';
import { CampaignNotificationFilters } from '../params/notifications.params';
import { CampaignNotificationPage } from '../models/notifications.model';
import { normalizeNotificationPage } from '../mappers/notifications.mapper';
import { NotificationsCache } from '../../data/caches/notifications.cache';
import { CacheDataSource } from '../../core/stores/cache/cache.datasource';
import { OptionCachePolicy } from '../../core/stores/cache/cache.datasource';

@Injectable()
export class NotificationsQuery {
	constructor(
		private readonly notificationService: NotificationService,
		private readonly notificationsCache: NotificationsCache,
		private readonly cacheDataSource: CacheDataSource,
	) {}

	loadNotifications(
		campaignId: string | number,
		filters: CampaignNotificationFilters,
		policy: OptionCachePolicy = 'network-first',
	): Observable<CampaignNotificationPage> {
		const key = this.notificationsCache.buildNotificationsCacheKey(campaignId, filters);
		const cached = this.notificationsCache.peekCampaignNotifications(campaignId, filters);
		const network$ = this.notificationService.getCampaignNotifications(campaignId, filters).pipe(
			tap((response) => this.notificationsCache.setCampaignNotifications(campaignId, filters, response)),
			map((response) => ({ value: response, fetchedAt: Date.now() })),
		);

		return this.cacheDataSource.query(key, cached, network$, policy).pipe(
			map((r) => normalizeNotificationPage(r.value)),
		);
	}

	retryNotification(
		notificationId: string | number,
		campaignId: string | number,
		filters: CampaignNotificationFilters,
	): Observable<void> {
		return this.notificationService.retryNotification(notificationId).pipe(
			tap(() => {
				this.notificationsCache.invalidateCampaignNotifications(campaignId, filters);
			}),
		);
	}
}
