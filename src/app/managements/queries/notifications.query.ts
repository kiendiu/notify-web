import { Injectable, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { tap } from 'rxjs/operators';
import { NotificationWsService } from '../../core/websocket/notification-ws.service';
import { NotificationService } from '../../data/services/notifications.service';
import { CampaignNotificationFilters, CampaignNotificationSummary, normalizeNotificationPage } from '../models/notifications.model';
import { NotificationsStateService } from '../states/notifications.state';

@Injectable({ providedIn: 'root' })
export class NotificationsQuery {
	private readonly notificationService = inject(NotificationService);
	private readonly websocket = inject(NotificationWsService);
	private readonly notificationsState = inject(NotificationsStateService);
	private realtimeSubscription: Subscription | null = null;

	connectRealtime(): void {
		if (this.realtimeSubscription) {
			return;
		}

		this.realtimeSubscription = this.websocket.watchNotifications().subscribe(() => {
			this.loadNotifications();
		});
	}

	clearNotificationState(): void {
		this.notificationsState.reset();
	}

	setActiveNotificationCampaign(campaignId: string): void {
		this.notificationsState.activeCampaignId.set(campaignId);
		this.notificationsState.filters.update((current) => ({ ...current, page: 0 }));
	}

	setNotificationFilters(filters: Partial<CampaignNotificationFilters>): void {
		this.notificationsState.filters.update((current) => ({ ...current, ...filters }));
	}

	setNotificationPage(page: number): void {
		this.notificationsState.filters.update((current) => ({ ...current, page }));
	}

	loadNotifications(): void {
		const campaignId = this.notificationsState.activeCampaignId();
		if (!campaignId) {
			return;
		}

		const filters = this.notificationsState.filters();
		this.notificationsState.loading.set(true);
		this.notificationsState.errorMessage.set(null);

		this.notificationService.getCampaignNotifications(campaignId, filters).pipe(
			tap((response) => {
				this.notificationsState.page.set(normalizeNotificationPage(response));
				this.notificationsState.loaded.set(true);
				this.notificationsState.lastFetched.set(Date.now());
				this.notificationsState.loading.set(false);
			}),
			tap({
				error: () => {
					this.notificationsState.loading.set(false);
					this.notificationsState.errorMessage.set('Không thể tải danh sách thông báo.');
				},
			}),
		).subscribe();
	}

	retryNotification(notificationId: string | number): void {
		this.notificationsState.retryLoading.set(true);
		this.notificationsState.retryingNotificationId.set(notificationId);
		this.notificationsState.retryErrorMessage.set(null);

		this.notificationService.retryNotification(notificationId).pipe(
			tap(() => {
				this.notificationsState.retryLoading.set(false);
				this.notificationsState.retryingNotificationId.set(null);
				this.loadNotifications();
			}),
			tap({
				error: () => {
					this.notificationsState.retryLoading.set(false);
					this.notificationsState.retryingNotificationId.set(null);
					this.notificationsState.retryErrorMessage.set('Không thể gửi lại thông báo.');
				},
			}),
		).subscribe();
	}

	applyRealtimeUpdate(notification: CampaignNotificationSummary): void {
		const currentPage = this.notificationsState.page();
		const nextItems = [notification, ...currentPage.items.filter((item) => item.id !== notification.id)];
		this.notificationsState.page.set({ ...currentPage, items: nextItems });
	}
}
