import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ComponentRef,
	DestroyRef,
	Input,
	OnDestroy,
	OnInit,
	ViewChild,
	ViewContainerRef,
	inject,
} from '@angular/core';
import { debounceTime, Observable, Subscription } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CampaignSummary } from '../../../managements/models/campaigns.model';
import { CampaignNotificationSummary, NotificationDeviceDetail } from '../../../managements/models/notifications.model';
import { CampaignNotificationFilters } from '../../../managements/params/notifications.params';
import { NotificationDetailQuery } from '../../../managements/queries/notification-detail.query';
import { NotificationDetailStateService } from '../../../managements/states/notification-detail.state';
import { SearchService } from '../../../data/services/search.service';
import { NotificationsQuery } from '../../../managements/queries/notifications.query';
import { NotificationsStateService } from '../../../managements/states/notifications.state';
import { NotificationWsService } from '../../../core/websocket/notification-ws.service';
import { NotificationDeviceStatusUpdateEvent, NotificationSocketEvent } from '../../../core/websocket/websocket.models';

@Component({
	selector: 'app-notifications',
	standalone: true,
	providers: [NotificationDetailQuery, NotificationDetailStateService],
	templateUrl: './notifications.html',
	styleUrl: './notifications.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsComponent implements OnInit, AfterViewInit, OnDestroy {
	private readonly notificationDetailQuery = inject(NotificationDetailQuery);
	private readonly notificationDetailState = inject(NotificationDetailStateService);

	constructor(
		private readonly destroyRef: DestroyRef,
		private readonly cdr: ChangeDetectorRef,
		private readonly searchService: SearchService,
		private readonly notificationsQuery: NotificationsQuery,
		private readonly notificationsState: NotificationsStateService,
		private readonly notificationWsService: NotificationWsService,
	) {}

	private campaignValue: Pick<CampaignSummary, 'id'> | CampaignSummary | null = null;
	private onBackValue: (() => void) | null = null;
	private selectedNotificationUpdatesSubscription: Subscription | null = null;
	private selectedNotificationDeviceStatusSubscription: Subscription | null = null;
	private notificationDetailComponentType: any = null;
	private notificationDetailComponentRef: ComponentRef<any> | null = null;

	@ViewChild('notificationDetailHost', { read: ViewContainerRef })
	private notificationDetailHost?: ViewContainerRef;

	readonly notificationState = () => this.notificationsState.getState();
	readonly campaign = () => this.campaignValue;
	readonly onBack = () => this.onBackValue;
	readonly selectedNotification = () => this.notificationDetailState.getState().selectedNotification;
	readonly notificationDetails = () => this.notificationDetailState.getState().notificationDetails;
	readonly notificationDetailsLoading = () => this.notificationDetailState.getState().notificationDetailsLoading;
	readonly notificationDetailsErrorMessage = () => this.notificationDetailState.getState().notificationDetailsErrorMessage;
	readonly showNotificationDetailsPanel = () => this.notificationDetailState.getState().showNotificationDetailsPanel;
	readonly notificationFilters = () => this.notificationState().filters;
	readonly notificationItems = () => this.notificationState().page.items;
	readonly notificationPage = () => this.notificationState().page;
	readonly notificationLoading = () => this.notificationState().loading;
	readonly notificationErrorMessage = () => this.notificationState().errorMessage;
	readonly retryLoading = () => this.notificationState().retryLoading;
	readonly retryingNotificationId = () => this.notificationState().retryingNotificationId;
	readonly retryError = () => this.notificationState().retryErrorMessage;
	readonly retryingDeviceId = () => this.notificationDetailState.getState().retryingDeviceId;
	readonly notificationCount = () => this.notificationPage().totalElements;
	readonly pageNumbers = () => this.buildPageNumbers(this.notificationPage().totalPages, this.notificationPage().number);
	readonly hasNoNotifications = () => !this.notificationLoading() && this.notificationItems().length === 0;
	readonly canGoPreviousPage = () => !this.notificationPage().first;
	readonly canGoNextPage = () => !this.notificationPage().last;

	@Input('campaign')
	set campaignInput(value: Pick<CampaignSummary, 'id'> | CampaignSummary | null) {
		this.campaignValue = value;
		this.setCampaign(value);
	}

	@Input('onBack')
	set onBackInput(value: (() => void) | null) {
		this.onBackValue = value;
		this.setOnBack(value);
	}

	ngOnInit(): void {
		void import('../notification-detail/notification-detail.component').then((module) => {
			this.notificationDetailComponentType = module.NotificationDetailComponent;
			this.syncNotificationDetailComponent();
		});

		this.notificationsState.state$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
			this.cdr.markForCheck();
			this.syncNotificationDetailComponent();
		});

		this.notificationWsService.watchNotifications().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
			if (this.campaign()) {
				this.loadNotifications(true);
			}
		});

		this.searchService.getSearch().pipe(debounceTime(250), takeUntilDestroyed(this.destroyRef)).subscribe((keyword) => {
			if (!this.campaign()) {
				return;
			}
			this.notificationsState.setKeyword(keyword ?? '');
			this.loadNotifications();
		});
	}

	ngAfterViewInit(): void {
		this.syncNotificationDetailComponent();
	}

	ngOnDestroy(): void {
		this.unsubscribeFromSelectedNotificationUpdates();
		this.unsubscribeFromSelectedNotificationDeviceStatusUpdates();
		this.notificationDetailComponentRef?.destroy();
		this.notificationDetailComponentRef = null;
	}

	reloadSelectedCampaignNotifications(): void {
		if (!this.campaign()) {
			return;
		}
		this.notificationsState.setFiltersToFirstPage();
		this.loadNotifications();
	}

	goToNotificationPage(page: number): void {
		const currentPage = this.notificationPage();
		if (page < 0 || page >= currentPage.totalPages || page === currentPage.number) {
			return;
		}
		this.notificationsState.setPageIndex(page);
		this.loadNotifications();
	}

	updateNotificationChannel(channel: string): void {
		if (!this.campaign()) {
			return;
		}
		this.notificationsState.setChannel(this.normalizeNotificationChannel(channel));
		this.loadNotifications();
	}

	updateNotificationStatus(status: string): void {
		if (!this.campaign()) {
			return;
		}
		this.notificationsState.setStatus(this.normalizeNotificationStatus(status));
		this.loadNotifications();
	}

	openNotificationDetails(notification: CampaignNotificationSummary): void {
		const currentSelectedId = this.notificationDetailState.getState().selectedNotificationId;
		const hasCurrentDetails = this.notificationDetailState.getState().notificationDetails.length > 0;
		const isSameNotification = currentSelectedId !== null && String(currentSelectedId) === String(notification.id);

		this.unsubscribeFromSelectedNotificationUpdates();
		this.unsubscribeFromSelectedNotificationDeviceStatusUpdates();
		this.notificationDetailState.openPanel(notification);
		this.subscribeToSelectedNotificationUpdates(notification.id);
		this.subscribeToSelectedNotificationDeviceStatusUpdates(notification.id);
		this.syncNotificationDetailComponent();
		this.cdr.markForCheck();

		if (!isSameNotification || !hasCurrentDetails) {
			this.loadNotificationDetails(notification.id);
		}
	}

	closeNotificationDetailsPanel(): void {
		this.unsubscribeFromSelectedNotificationUpdates();
		this.unsubscribeFromSelectedNotificationDeviceStatusUpdates();
		this.notificationDetailState.closePanel();
		this.syncNotificationDetailComponent();
		this.cdr.markForCheck();
	}

	retryNotification(): void {
		const notification = this.selectedNotification();
		if (!notification) {
			return;
		}
		this.retryNotificationById(notification.id);
	}

	retryNotificationFromTable(notification: CampaignNotificationSummary): void {
		this.retryNotificationById(notification.id);
	}

	retryNotificationFromDevice(detail: NotificationDeviceDetail): void {
		if (!this.selectedNotification()) {
			return;
		}

		this.notificationDetailState.markNotificationDetailRetryPending(detail.id, detail.deviceId ?? String(detail.id));
		this.syncNotificationDetailComponent();
		this.cdr.markForCheck();

		this.withLifecycle(this.notificationDetailQuery.retryNotificationDevice(detail.id)).subscribe({
			next: () => {
				this.notificationDetailQuery.invalidateNotificationDetails(this.selectedNotification()!.id);
				this.notificationDetailState.setRetryingDeviceId(null);
				this.syncNotificationDetailComponent();
				this.cdr.markForCheck();
			},
			error: () => {
				this.notificationDetailState.setRetryingDeviceId(null);
				this.notificationDetailState.restoreNotificationDetail(detail);
				this.syncNotificationDetailComponent();
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

	private setCampaign(campaign: Pick<CampaignSummary, 'id'> | CampaignSummary | null): void {
		if (!campaign) {
			this.unsubscribeFromSelectedNotificationUpdates();
			this.unsubscribeFromSelectedNotificationDeviceStatusUpdates();
			this.notificationsState.reset();
			this.closeNotificationDetailsPanel();
			return;
		}

		this.notificationsState.setActiveCampaignId(String(campaign.id));
		this.notificationsState.setFiltersToFirstPage();
		this.loadNotifications();
	}

	private setOnBack(onBack: (() => void) | null): void {
		this.onBackValue = onBack;
	}

	private subscribeToSelectedNotificationUpdates(notificationId: string | number): void {
		this.selectedNotificationUpdatesSubscription = this.notificationWsService.watchNotifications().subscribe((event) => {
			this.handleSelectedNotificationRealtimeEvent(notificationId, event);
		});
	}

	private subscribeToSelectedNotificationDeviceStatusUpdates(notificationId: string | number): void {
		this.selectedNotificationDeviceStatusSubscription = this.notificationWsService.watchNotificationDeviceStatus(notificationId).subscribe((event) => {
			this.handleSelectedNotificationDeviceStatusRealtimeEvent(event);
		});
	}

	private unsubscribeFromSelectedNotificationUpdates(): void {
		this.selectedNotificationUpdatesSubscription?.unsubscribe();
		this.selectedNotificationUpdatesSubscription = null;
	}

	private unsubscribeFromSelectedNotificationDeviceStatusUpdates(): void {
		this.selectedNotificationDeviceStatusSubscription?.unsubscribe();
		this.selectedNotificationDeviceStatusSubscription = null;
	}

	private handleSelectedNotificationRealtimeEvent(notificationId: string | number, event: NotificationSocketEvent): void {
		const payload = event.data;
		if (!payload || String(payload.id) !== String(notificationId)) {
			return;
		}

		this.notificationDetailState.setSelectedNotification(payload);
		this.notificationDetailState.setPanelVisible(true);
		this.refreshNotificationDetails(notificationId);
		this.syncNotificationDetailComponent();
		this.cdr.markForCheck();
	}

	private handleSelectedNotificationDeviceStatusRealtimeEvent(event: NotificationDeviceStatusUpdateEvent): void {
		if (!event.deviceId) {
			return;
		}

		this.notificationDetailState.updateNotificationDetailByDeviceId(event.deviceId, {
			status: event.status,
			errorMessage: event.errorMessage ?? null,
		});

		if (this.notificationDetailState.getState().retryingDeviceId === event.deviceId) {
			this.notificationDetailState.setRetryingDeviceId(null);
		}

		this.syncNotificationDetailComponent();
		this.cdr.markForCheck();
	}

	private loadNotificationDetails(notificationId: string | number): void {
		this.notificationDetailState.startLoadingNotificationDetails();

		this.withLifecycle(this.notificationDetailQuery.loadNotificationDetails(notificationId)).subscribe({
			next: (response) => {
				this.notificationDetailState.setNotificationDetailsFromResponse(response);
				this.syncNotificationDetailComponent();
				this.cdr.markForCheck();
			},
			error: () => {
				this.notificationDetailState.setNotificationDetailsError();
				this.syncNotificationDetailComponent();
				this.cdr.markForCheck();
			},
		});
	}

	private refreshNotificationDetails(notificationId: string | number): void {
		this.notificationDetailQuery.invalidateNotificationDetails(notificationId);

		this.withLifecycle(this.notificationDetailQuery.loadNotificationDetails(notificationId)).subscribe({
			next: (response) => {
				this.notificationDetailState.setNotificationDetailsFromResponse(response);
				if (this.notificationDetailState.getState().retryingDeviceId) {
					this.notificationDetailState.setRetryingDeviceId(null);
				}
				this.syncNotificationDetailComponent();
				this.cdr.markForCheck();
			},
			error: () => {
				this.syncNotificationDetailComponent();
				this.cdr.markForCheck();
			},
		});
	}

	private loadNotifications(forceRefresh = false): void {
		const currentState = this.notificationsState.getState();
		const campaignId = currentState.activeCampaignId;
		if (!campaignId) {
			return;
		}

		const filters = currentState.filters;
		this.notificationsState.setLoading(true);
		this.notificationsState.setErrorMessage(null);

		this.withLifecycle(this.notificationsQuery.loadNotifications(campaignId, filters, { forceRefresh })).subscribe({
			next: (page) => {
				this.notificationsState.setPage(page);
				this.notificationsState.setLoaded(true);
				this.notificationsState.setLastFetched(Date.now());
				this.notificationsState.setLoading(false);
				this.syncNotificationDetailComponent();
				this.cdr.markForCheck();
			},
			error: () => {
				this.notificationsState.setLoading(false);
				this.notificationsState.setErrorMessage('Không thể tải danh sách thông báo.');
				this.syncNotificationDetailComponent();
				this.cdr.markForCheck();
			},
		});
	}

	private retryNotificationById(notificationId: string | number): void {
		const currentState = this.notificationsState.getState();
		const campaignId = currentState.activeCampaignId;
		if (!campaignId) {
			return;
		}

		const filters = currentState.filters;
		this.notificationsState.markNotificationPending(notificationId);
		this.notificationsState.setRetryLoading(true);
		this.notificationsState.setRetryingNotificationId(notificationId);
		this.notificationsState.setRetryErrorMessage(null);

		this.withLifecycle(this.notificationsQuery.retryNotification(notificationId, campaignId, filters)).subscribe({
			next: () => {
				this.notificationsState.setRetryLoading(false);
				this.notificationsState.setRetryingNotificationId(null);
				this.loadNotifications();
				this.syncNotificationDetailComponent();
				this.cdr.markForCheck();
			},
			error: () => {
				this.notificationsState.setRetryLoading(false);
				this.notificationsState.setRetryingNotificationId(null);
				this.notificationsState.setRetryErrorMessage('Không thể gửi lại thông báo.');
				this.syncNotificationDetailComponent();
				this.cdr.markForCheck();
			},
		});
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

	private withLifecycle<T>(source: Observable<T>): Observable<T> {
		return source.pipe(takeUntilDestroyed(this.destroyRef));
	}

	private syncNotificationDetailComponent(): void {
		if (!this.notificationDetailHost) {
			return;
		}

		if (!this.showNotificationDetailsPanel()) {
			this.notificationDetailHost.clear();
			this.notificationDetailComponentRef?.destroy();
			this.notificationDetailComponentRef = null;
			return;
		}

		if (!this.notificationDetailComponentType) {
			return;
		}

		if (!this.notificationDetailComponentRef) {
			this.notificationDetailHost.clear();
			this.notificationDetailComponentRef = this.notificationDetailHost.createComponent(this.notificationDetailComponentType);
		}

		const detailComponent = this.notificationDetailComponentRef.instance as {
			selectedNotificationValue: CampaignNotificationSummary | null;
			notificationDetailsValue: NotificationDeviceDetail[];
			notificationDetailsLoadingValue: boolean;
			notificationDetailsErrorMessageValue: string | null;
			retryLoadingValue: boolean;
			retryErrorValue: string | null;
			retryingDeviceIdValue: string | null;
			closeFn: () => void;
			retryFn: () => void;
			retryDeviceFn: (detail: NotificationDeviceDetail) => void;
		};

		detailComponent.selectedNotificationValue = this.selectedNotification();
		detailComponent.notificationDetailsValue = this.notificationDetails();
		detailComponent.notificationDetailsLoadingValue = this.notificationDetailsLoading();
		detailComponent.notificationDetailsErrorMessageValue = this.notificationDetailsErrorMessage();
		detailComponent.retryLoadingValue = this.retryLoading();
		detailComponent.retryErrorValue = this.retryError();
		detailComponent.retryingDeviceIdValue = this.retryingDeviceId();
		detailComponent.closeFn = () => this.closeNotificationDetailsPanel();
		detailComponent.retryFn = () => this.retryNotification();
		detailComponent.retryDeviceFn = (detail: NotificationDeviceDetail) => this.retryNotificationFromDevice(detail);
		this.notificationDetailComponentRef.changeDetectorRef.detectChanges();
	}
}
