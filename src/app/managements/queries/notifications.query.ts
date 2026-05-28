import { Injectable, inject } from '@angular/core';
import { Observable, map, of, tap } from 'rxjs';
import { NotificationService } from '../../data/services/notifications.service';
import { CampaignNotificationFilters, CampaignNotificationPage, normalizeNotificationPage } from '../models/notifications.model';
import { NotificationsCache } from '../../data/caches/notifications.cache';

@Injectable()
export class NotificationsQuery {
	private readonly notificationService = inject(NotificationService);
	private readonly notificationsCache = inject(NotificationsCache);

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
