import { Injectable, OnDestroy, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { tap } from 'rxjs/operators';
import { NotificationWsService } from '../../core/websocket/notification-ws.service';
import { NotificationService } from '../../data/services/notifications.service';
import { CampaignNotificationFilters, CampaignNotificationSummary, normalizeNotificationPage } from '../models/notifications.model';
import { NotificationsStateService } from '../states/notifications.state';

@Injectable()
export class NotificationsQuery implements OnDestroy {
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
		this.notificationsState.setActiveCampaignId(campaignId);
		this.notificationsState.setFilters({ ...this.notificationsState.getState().filters, page: 0 });
	}

	setNotificationFilters(filters: Partial<CampaignNotificationFilters>): void {
		this.notificationsState.setFilters({ ...this.notificationsState.getState().filters, ...filters });
	}

	setNotificationPage(page: number): void {
		this.notificationsState.setFilters({ ...this.notificationsState.getState().filters, page });
	}

	loadNotifications(): void {
		const currentState = this.notificationsState.getState();
		const campaignId = currentState.activeCampaignId;
		if (!campaignId) {
			return;
		}

		const filters = currentState.filters;
		this.notificationsState.setLoading(true);
		this.notificationsState.setErrorMessage(null);

		this.notificationService.getCampaignNotifications(campaignId, filters).pipe(
			tap((response) => {
				this.notificationsState.setPage(normalizeNotificationPage(response));
				this.notificationsState.setLoaded(true);
				this.notificationsState.setLastFetched(Date.now());
				this.notificationsState.setLoading(false);
			}),
			tap({
				error: () => {
					this.notificationsState.setLoading(false);
					this.notificationsState.setErrorMessage('Không thể tải danh sách thông báo.');
				},
			}),
		).subscribe();
	}

	retryNotification(notificationId: string | number): void {
		this.markNotificationAsPending(notificationId);
		this.notificationsState.setRetryLoading(true);
		this.notificationsState.setRetryingNotificationId(notificationId);
		this.notificationsState.setRetryErrorMessage(null);

		this.notificationService.retryNotification(notificationId).pipe(
			tap(() => {
				this.notificationsState.setRetryLoading(false);
				this.notificationsState.setRetryingNotificationId(null);
			}),
			tap({
				error: () => {
					this.notificationsState.setRetryLoading(false);
					this.notificationsState.setRetryingNotificationId(null);
					this.notificationsState.setRetryErrorMessage('Không thể gửi lại thông báo.');
				},
			}),
		).subscribe();
	}

	applyRealtimeUpdate(notification: CampaignNotificationSummary): void {
		const currentPage = this.notificationsState.getState().page;
		const nextItems = [notification, ...currentPage.items.filter((item) => item.id !== notification.id)];
		this.notificationsState.setPage({ ...currentPage, items: nextItems });
	}

	private markNotificationAsPending(notificationId: string | number): void {
		const currentState = this.notificationsState.getState();
		const currentPage = currentState.page;
		const nextItems = currentPage.items.map((item) => (
			String(item.id) === String(notificationId)
				? { ...item, status: 'PENDING' }
				: item
		));

		if (nextItems === currentPage.items) {
			return;
		}

		this.notificationsState.setPage({ ...currentPage, items: nextItems });
	}

	ngOnDestroy(): void {
		this.realtimeSubscription?.unsubscribe();
		this.realtimeSubscription = null;
	}
}
