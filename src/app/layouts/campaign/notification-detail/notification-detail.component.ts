import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CampaignNotificationSummary, NotificationDeviceDetail } from '../../../managements/models/notifications.model';
import { NotificationDetailController } from './notification-detail.controller';

@Component({
	selector: 'app-notification-detail',
	standalone: true,
	imports: [CommonModule],
	providers: [NotificationDetailController],
	templateUrl: './notification-detail.html',
	styleUrl: './notification-detail.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationDetailComponent {
	private readonly notificationDetailController = inject(NotificationDetailController);

	readonly selectedNotification = input<CampaignNotificationSummary | null>(null);
	readonly notificationDetails = input<NotificationDeviceDetail[]>([]);
	readonly notificationDetailsLoading = input(false);
	readonly notificationDetailsErrorMessage = input<string | null>(null);
	readonly retryLoading = input(false);
	readonly retryError = input<string | null>(null);
	readonly retryingDeviceId = input<string | null>(null);

	readonly close = output<void>();
	readonly retry = output<void>();
	readonly retryDevice = output<NotificationDeviceDetail>();

	formatDate(value: string | null | undefined): string {
		return this.notificationDetailController.formatDate(value);
	}

	getDisplayChannel(channel: string): string {
		return this.notificationDetailController.getDisplayChannel(channel);
	}

	getNotificationDestination(detail: NotificationDeviceDetail): string {
		return this.notificationDetailController.getNotificationDestination(detail);
	}

	getNotificationRetryText(detail: NotificationDeviceDetail): string {
		return this.notificationDetailController.getNotificationRetryText(detail);
	}

	getNotificationStatusText(status: string): string {
		return this.notificationDetailController.getNotificationStatusText(status);
	}

	getStatusDotColor(status: string): string {
		return this.notificationDetailController.getStatusDotColor(status);
	}

	getStatusTextStyleColor(status: string): string {
		return this.notificationDetailController.getStatusTextStyleColor(status);
	}

	trackByDeviceDetailId(_: number, detail: NotificationDeviceDetail): number {
		return this.notificationDetailController.trackByDeviceDetailId(_, detail);
	}

	isRetryingDevice(detail: NotificationDeviceDetail): boolean {
		return this.notificationDetailController.isRetryingDevice(detail, this.retryingDeviceId());
	}

	onClose(): void { this.close.emit(); }
	onRetry(): void { this.retry.emit(); }
	onRetryDevice(detail: NotificationDeviceDetail): void { this.retryDevice.emit(detail); }
	isFailedStatus(status: string | undefined): boolean { return this.notificationDetailController.isFailedStatus(status); }
}