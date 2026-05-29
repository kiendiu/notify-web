import { Injectable } from '@angular/core';
import { Observable, map, of, tap } from 'rxjs';
import { NotificationService } from '../../data/services/notifications.service';
import { CampaignNotificationFilters } from '../params/notifications.params';
import { CampaignNotificationPage } from '../models/notifications.model';
import { normalizeNotificationPage } from '../mappers/notifications.mapper';
import { NotificationsCache } from '../../data/caches/notifications.cache';

@Injectable()
export class NotificationsQuery {
	constructor(
		private readonly notificationService: NotificationService,
		private readonly notificationsCache: NotificationsCache,
	) {}

	loadNotifications(
		campaignId: string | number,
		filters: CampaignNotificationFilters,
		options?: { forceRefresh?: boolean },
	): Observable<CampaignNotificationPage> {
		if (options?.forceRefresh) {
			return this.notificationService.getCampaignNotifications(campaignId, filters).pipe(
				tap((response) => {
					this.notificationsCache.setCampaignNotifications(campaignId, filters, response);
				}),
				map((response) => normalizeNotificationPage(response)),
			);
		}

		const cached = this.notificationsCache.getCampaignNotifications(campaignId, filters);
		if (cached) {
			return of(normalizeNotificationPage(cached));
		}

		return this.notificationService.getCampaignNotifications(campaignId, filters).pipe(
			tap((response) => {
				this.notificationsCache.setCampaignNotifications(campaignId, filters, response);
			}),
			map((response) => normalizeNotificationPage(response)),
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
