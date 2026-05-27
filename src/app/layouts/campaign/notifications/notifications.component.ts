import { ChangeDetectionStrategy, Component, DestroyRef, Injector, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CampaignSummary } from '../../../managements/models/campaigns.model';
import { CampaignNotificationSummary, NotificationDeviceDetail } from '../../../managements/models/notifications.model';
import { NotificationsController } from './notifications.controller';
import { NotificationDetailComponent } from '../notification-detail/notification-detail.component';

@Component({
	selector: 'app-notifications',
	standalone: true,
	imports: [CommonModule, NotificationDetailComponent],
	providers: [NotificationsController],
	templateUrl: './notifications.html',
	styleUrl: './notifications.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsComponent{
	private readonly destroyRef = inject(DestroyRef);
	private readonly injector = inject(Injector);
	private readonly notificationsController = inject(NotificationsController);

	private campaignValue: Pick<CampaignSummary, 'id'> | CampaignSummary | null = null;
	private onBackValue: (() => void) | null = null;

	@Input('campaign')
	set campaignInput(value: Pick<CampaignSummary, 'id'> | CampaignSummary | null) {
		this.campaignValue = value;
		this.notificationsController.setCampaign(value);
	}

	@Input('onBack')
	set onBackInput(value: (() => void) | null) {
		this.onBackValue = value;
		this.notificationsController.setOnBack(value);
	}

    readonly campaign = () => this.campaignValue;
    readonly onBack = () => this.onBackValue;
    readonly notificationState = this.notificationsController.notificationState;
    readonly selectedNotification = this.notificationsController.selectedNotification;
    readonly notificationDetails = this.notificationsController.notificationDetails;
    readonly notificationDetailsLoading = this.notificationsController.notificationDetailsLoading;
    readonly notificationDetailsErrorMessage = this.notificationsController.notificationDetailsErrorMessage;
    readonly showNotificationDetailsPanel = this.notificationsController.showNotificationDetailsPanel;
    readonly notificationFilters = this.notificationsController.notificationFilters;
    readonly notificationItems = this.notificationsController.notificationItems;
    readonly notificationPage = this.notificationsController.notificationPage;
    readonly notificationLoading = this.notificationsController.notificationLoading;
    readonly notificationErrorMessage = this.notificationsController.notificationErrorMessage;
    readonly retryLoading = this.notificationsController.retryLoading;
    readonly retryingNotificationId = this.notificationsController.retryingNotificationId;
	readonly retryingDeviceId = this.notificationsController.retryingDeviceId;
    readonly retryError = this.notificationsController.retryError;
    readonly notificationCount = this.notificationsController.notificationCount;
    readonly pageNumbers = this.notificationsController.pageNumbers;
    readonly hasNoNotifications = this.notificationsController.hasNoNotifications;
    readonly canGoPreviousPage = this.notificationsController.canGoPreviousPage;
    readonly canGoNextPage = this.notificationsController.canGoNextPage;

	ngOnInit(): void {
		this.notificationsController.init(this.destroyRef, this.injector);
	}

	reloadSelectedCampaignNotifications(): void {
		this.notificationsController.reloadSelectedCampaignNotifications();
	}

	goToNotificationPage(page: number): void {
		this.notificationsController.goToNotificationPage(page);
	}

	updateNotificationChannel(channel: string): void {
		this.notificationsController.updateNotificationChannel(channel);
	}

	updateNotificationStatus(status: string): void {
		this.notificationsController.updateNotificationStatus(status);
	}

	openNotificationDetails(notification: CampaignNotificationSummary): void {
		this.notificationsController.openNotificationDetails(notification);
	}

	closeNotificationDetailsPanel(): void {
		this.notificationsController.closeNotificationDetailsPanel();
	}

	retryNotification(): void {
		this.notificationsController.retryNotification();
	}

	retryNotificationFromTable(notification: CampaignNotificationSummary): void {
		this.notificationsController.retryNotificationFromTable(notification);
	}

	retryNotificationFromDevice(detail: NotificationDeviceDetail): void {
		this.notificationsController.retryNotificationDevice(detail);
	}

	isRetryingNotification(notificationId: number | string | null | undefined): boolean {
		return this.notificationsController.isRetryingNotification(notificationId);
	}

	emitBack(): void {
		this.notificationsController.emitBack();
	}

	trackByNotificationId(_: number, notification: CampaignNotificationSummary): number {
		return this.notificationsController.trackByNotificationId(_, notification);
	}

	formatDate(value: string | null | undefined): string {
		return this.notificationsController.formatDate(value);
	}

	getDisplayStatus(status: string): string {
		return this.notificationsController.getDisplayStatus(status);
	}

	getDisplayChannel(channel: string): string {
		return this.notificationsController.getDisplayChannel(channel);
	}

	getNotificationDeviceCount(notification: CampaignNotificationSummary): number {
		return this.notificationsController.getNotificationDeviceCount(notification);
	}

	channelIcon(channel: string): string {
		return this.notificationsController.channelIcon(channel);
	}

	getChannelBadgeClass(channel: string): string {
		return this.notificationsController.getChannelBadgeClass(channel);
	}

	getStatusDotColor(status: string): string {
		return this.notificationsController.getStatusDotColor(status);
	}

	getStatusTextStyleColor(status: string): string {
		return this.notificationsController.getStatusTextStyleColor(status);
	}

	isFailedNotification(status: string): boolean {
		return this.notificationsController.isFailedNotification(status);
	}
}