import { ChangeDetectorRef, DestroyRef, Injectable, OnDestroy, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { debounceTime } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SearchService } from '../../../data/services/search.service';
import { NotificationDetailService } from '../../../data/services/notification-detail.service';
import { CampaignSummary } from '../../../managements/models/campaigns.model';
import { CampaignNotificationFilters, CampaignNotificationSummary, NotificationDeviceDetail, normalizeNotificationDetails } from '../../../managements/models/notifications.model';
import { NotificationsQuery } from '../../../managements/queries/notifications.query';
import { NotificationsStateService, initialNotificationState } from '../../../managements/states/notifications.state';
import { NotificationWsService } from '../../../core/websocket/notification-ws.service';
import { NotificationSocketEvent } from '../../../core/websocket/websocket.models';

@Injectable()
export class NotificationsController implements OnDestroy {
	private readonly notificationDetailService = inject(NotificationDetailService);
	private readonly searchService = inject(SearchService);
	private readonly notificationsQuery = inject(NotificationsQuery);
	private readonly notificationsState = inject(NotificationsStateService);
	private readonly notificationWsService = inject(NotificationWsService);
	private readonly cdr = inject(ChangeDetectorRef);
	private destroyRef: DestroyRef | null = null;

	private campaignValue: Pick<CampaignSummary, 'id'> | CampaignSummary | null = null;
	private onBackValue: (() => void) | null = null;
	private selectedNotificationValue: CampaignNotificationSummary | null = null;
	private notificationDetailsValue: NotificationDeviceDetail[] = [];
	private notificationDetailsLoadingValue = false;
	private notificationDetailsErrorMessageValue: string | null = null;
	private showNotificationDetailsPanelValue = false;
	private notificationStateValue = initialNotificationState;
	private retryingDeviceIdValue: string | null = null;
	private selectedNotificationUpdatesSubscription: Subscription | null = null;

	readonly notificationState = () => this.notificationStateValue;
	readonly campaign = () => this.campaignValue;
	readonly onBack = () => this.onBackValue;
	readonly selectedNotification = () => this.selectedNotificationValue;
	readonly notificationDetails = () => this.notificationDetailsValue;
	readonly notificationDetailsLoading = () => this.notificationDetailsLoadingValue;
	readonly notificationDetailsErrorMessage = () => this.notificationDetailsErrorMessageValue;
	readonly showNotificationDetailsPanel = () => this.showNotificationDetailsPanelValue;
	readonly notificationFilters = () => this.notificationState().filters;
	readonly notificationItems = () => this.notificationState().page.items;
	readonly notificationPage = () => this.notificationState().page;
	readonly notificationLoading = () => this.notificationState().loading;
	readonly notificationErrorMessage = () => this.notificationState().errorMessage;
	readonly retryLoading = () => this.notificationState().retryLoading;
	readonly retryingNotificationId = () => this.notificationState().retryingNotificationId;
	readonly retryError = () => this.notificationState().retryErrorMessage;
	readonly retryingDeviceId = () => this.retryingDeviceIdValue;
	readonly notificationCount = () => this.notificationPage().totalElements;
	readonly pageNumbers = () => this.buildPageNumbers(this.notificationPage().totalPages, this.notificationPage().number);
	readonly hasNoNotifications = () => !this.notificationLoading() && this.notificationItems().length === 0;
	readonly canGoPreviousPage = () => !this.notificationPage().first;
	readonly canGoNextPage = () => !this.notificationPage().last;

	init(destroyRef: DestroyRef, injector: { get<T>(token: unknown, notFoundValue?: unknown, flags?: unknown): T }): void {
		this.destroyRef = destroyRef;
		this.notificationsState.state$.pipe(takeUntilDestroyed(destroyRef)).subscribe((state) => {
			this.notificationStateValue = state ?? initialNotificationState;
			this.cdr.markForCheck();
		});
		this.notificationsQuery.connectRealtime();

		this.searchService.getSearch().pipe(debounceTime(250), takeUntilDestroyed(destroyRef)).subscribe((keyword) => {
			if (!this.campaign()) {
				return;
			}
			this.notificationsQuery.setNotificationFilters({ keyWord: keyword ?? '', page: 0 });
			this.notificationsQuery.loadNotifications();
		});
	}

	setCampaign(campaign: Pick<CampaignSummary, 'id'> | CampaignSummary | null): void {
		this.campaignValue = campaign;

		if (!campaign) {
			this.unsubscribeFromSelectedNotificationUpdates();
			this.notificationsQuery.clearNotificationState();
			this.closeNotificationDetailsPanel();
			return;
		}

		this.notificationsQuery.setActiveNotificationCampaign(String(campaign.id));
		this.notificationsQuery.loadNotifications();
	}

	setOnBack(onBack: (() => void) | null): void {
		this.onBackValue = onBack;
	}

	reloadSelectedCampaignNotifications(): void {
		if (!this.campaign()) {
			return;
		}
		this.notificationsQuery.setNotificationPage(0);
		this.notificationsQuery.loadNotifications();
	}

	goToNotificationPage(page: number): void {
		const currentPage = this.notificationPage();
		if (page < 0 || page >= currentPage.totalPages || page === currentPage.number) {
			return;
		}
		this.notificationsQuery.setNotificationPage(page);
		this.notificationsQuery.loadNotifications();
	}

	updateNotificationChannel(channel: string): void {
		if (!this.campaign()) {
			return;
		}
		this.notificationsQuery.setNotificationFilters({ channel: this.normalizeNotificationChannel(channel), page: 0 });
		this.notificationsQuery.loadNotifications();
	}

	updateNotificationStatus(status: string): void {
		if (!this.campaign()) {
			return;
		}
		this.notificationsQuery.setNotificationFilters({ status: this.normalizeNotificationStatus(status), page: 0 });
		this.notificationsQuery.loadNotifications();
	}

	openNotificationDetails(notification: CampaignNotificationSummary): void {
		this.unsubscribeFromSelectedNotificationUpdates();
		this.selectedNotificationValue = notification;
		this.resetNotificationDetailsPanelState();
		this.showNotificationDetailsPanelValue = true;
		this.retryingDeviceIdValue = null;
		this.cdr.markForCheck();
		this.subscribeToSelectedNotificationUpdates(notification.id);

		this.loadNotificationDetails(notification.id);
	}

	closeNotificationDetailsPanel(): void {
		this.unsubscribeFromSelectedNotificationUpdates();
		this.showNotificationDetailsPanelValue = false;
		this.selectedNotificationValue = null;
		this.notificationDetailsValue = [];
		this.notificationDetailsErrorMessageValue = null;
		this.notificationDetailsLoadingValue = false;
		this.retryingDeviceIdValue = null;
		this.cdr.markForCheck();
	}

	retryNotification(): void {
		const notification = this.selectedNotification();
		if (!notification) {
			return;
		}
		this.notificationsQuery.retryNotification(notification.id);
	}

	retryNotificationFromTable(notification: CampaignNotificationSummary): void {
		this.notificationsQuery.retryNotification(notification.id);
	}

	retryNotificationDevice(detail: NotificationDeviceDetail): void {
		if (!this.selectedNotification()) {
			return;
		}

		const previousDetail = this.notificationDetailsValue.find((item) => item.id === detail.id) ?? detail;
		this.retryingDeviceIdValue = detail.deviceId ?? String(detail.id);
		this.updateNotificationDeviceDetail(detail.id, {
			status: 'PENDING',
			errorMessage: null,
			updatedAt: new Date().toISOString(),
		});
		this.cdr.markForCheck();

		this.notificationDetailService.retryNotificationDevice(detail.id).pipe(takeUntilDestroyed(this.destroyRef!)).subscribe({
			next: () => {
				this.notificationDetailService.invalidateNotificationDetails(this.selectedNotification()!.id);
				this.retryingDeviceIdValue = null;
				this.cdr.markForCheck();
			},
			error: () => {
				this.retryingDeviceIdValue = null;
				this.updateNotificationDeviceDetail(previousDetail.id, previousDetail);
				this.cdr.markForCheck();
			},
		});
	}

	isRetryingNotification(notificationId: number | string | null | undefined): boolean {
		if (notificationId === null || notificationId === undefined) {
			return false;
		}
		return String(this.retryingNotificationId()) === String(notificationId);
	}

	emitBack(): void {
		this.onBackValue?.();
		this.searchService.setSearch('');
	}

	trackByNotificationId(_: number, notification: CampaignNotificationSummary): number {
		return notification.id;
	}

	formatDate(value: string | null | undefined): string {
		if (!value) {
			return '-';
		}
		return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
	}

	getDisplayStatus(status: string): string {
		const normalized = status.toUpperCase();
		switch (normalized) {
			case 'SENT': return 'Đã gửi';
			case 'PENDING': return 'Đang chờ';
			case 'FAILED': return 'Thất bại';
			default: return status;
		}
	}

	getDisplayChannel(channel: string): string {
		const channels = this.getChannelValues(channel);
		if (channels.length === 0) {
			return '-';
		}
		return channels.map((value) => {
			switch (value) {
				case 'PUSH': return 'Push';
				case 'EMAIL': return 'Email';
				case 'SMS': return 'Message';
				default: return value;
			}
		}).join(', ');
	}

	getNotificationDeviceCount(notification: CampaignNotificationSummary): number {
		return notification.count ?? notification.Count ?? 0;
	}

	channelIcon(channel: string): string {
		const channels = this.getChannelValues(channel);
		if (channels.length > 1) {
			return 'fa-layer-group';
		}
		if (channels.length === 0) {
			return 'fa-bullhorn';
		}
		switch (channels[0]) {
			case 'PUSH': return 'fa-mobile-alt';
			case 'EMAIL': return 'fa-envelope';
			case 'SMS': return 'fa-comment-dots';
			default: return 'fa-bullhorn';
		}
	}

	getChannelBadgeClass(channel: string): string {
		const channels = this.getChannelValues(channel);
		if (channels.length > 1 || channels.length === 0) {
			return 'default';
		}
		return channels[0].toLowerCase();
	}

	getStatusDotColor(status: string): string {
		const normalized = status.toUpperCase();
		switch (normalized) {
			case 'SENT': return '#10b981';
			case 'FAILED': return '#ef4444';
			case 'PENDING': return '#f59e0b';
			default: return '#cbd5e1';
		}
	}

	getStatusTextStyleColor(status: string): string {
		const normalized = status.toUpperCase();
		switch (normalized) {
			case 'SENT': return '#047857';
			case 'FAILED': return '#dc2626';
			case 'PENDING': return '#b45309';
			default: return '#475569';
		}
	}

	isFailedNotification(status: string): boolean {
		return status.toUpperCase() === 'FAILED';
	}

	isRetryingDevice(detail: NotificationDeviceDetail): boolean {
		const retryingId = this.retryingDeviceIdValue;
		if (!retryingId) {
			return false;
		}
		return (detail.deviceId ?? String(detail.id)) === retryingId;
	}

	private subscribeToSelectedNotificationUpdates(notificationId: string | number): void {
		this.selectedNotificationUpdatesSubscription = this.notificationWsService.watchNotifications().subscribe((event) => {
			this.handleSelectedNotificationRealtimeEvent(notificationId, event);
		});
	}

	private unsubscribeFromSelectedNotificationUpdates(): void {
		this.selectedNotificationUpdatesSubscription?.unsubscribe();
		this.selectedNotificationUpdatesSubscription = null;
	}

	private handleSelectedNotificationRealtimeEvent(notificationId: string | number, event: NotificationSocketEvent): void {
		const payload = event.data;
		if (!payload || String(payload.id) !== String(notificationId)) {
			return;
		}

		this.selectedNotificationValue = payload;
		this.notificationDetailService.invalidateNotificationDetails(notificationId);
		this.loadNotificationDetails(notificationId);

		if (this.retryingDeviceIdValue) {
			this.retryingDeviceIdValue = null;
		}
		this.cdr.markForCheck();
	}

	private loadNotificationDetails(notificationId: string | number): void {
		this.notificationDetailService.getNotificationDetails(notificationId).pipe(takeUntilDestroyed(this.destroyRef!)).subscribe({
			next: (response) => {
				this.notificationDetailsValue = normalizeNotificationDetails(response);
				this.notificationDetailsLoadingValue = false;
				this.cdr.markForCheck();
			},
			error: () => {
				this.notificationDetailsLoadingValue = false;
				this.notificationDetailsErrorMessageValue = 'Không thể tải chi tiết thiết bị. Vui lòng thử lại.';
				this.cdr.markForCheck();
			},
		});
	}

	private resetNotificationDetailsPanelState(): void {
		this.notificationDetailsValue = [];
		this.notificationDetailsErrorMessageValue = null;
		this.notificationDetailsLoadingValue = true;
	}

	private updateNotificationDeviceDetail(detailId: number, nextDetail: Partial<NotificationDeviceDetail>): void {
		this.notificationDetailsValue = this.notificationDetailsValue.map((item) => (item.id === detailId ? { ...item, ...nextDetail } : item));
	}

	ngOnDestroy(): void {
		this.unsubscribeFromSelectedNotificationUpdates();
	}

	private normalizeNotificationChannel(channel: string): CampaignNotificationFilters['channel'] {
		const normalized = channel.toLowerCase();
		if (normalized === 'push' || normalized === 'email' || normalized === 'sms') {
			return normalized;
		}
		return '';
	}

	private normalizeNotificationStatus(status: string): CampaignNotificationFilters['status'] {
		const normalized = status.toLowerCase();
		if (normalized === 'sent' || normalized === 'pending' || normalized === 'failed') {
			return normalized;
		}
		return '';
	}

	private buildPageNumbers(totalPages: number, currentPage: number): number[] {
		if (totalPages <= 1) {
			return totalPages === 1 ? [0] : [];
		}
		const start = Math.max(0, currentPage - 1);
		const end = Math.min(totalPages - 1, start + 2);
		const pages: number[] = [];
		for (let page = start; page <= end; page += 1) {
			pages.push(page);
		}
		return pages;
	}

	private getChannelValues(channel: string): string[] {
		if (!channel) {
			return [];
		}
		return channel.split(',').map((item) => item.trim().toUpperCase()).filter((item) => item.length > 0);
	}
}