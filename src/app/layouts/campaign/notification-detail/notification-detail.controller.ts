import { Injectable } from '@angular/core';
import { CampaignNotificationSummary, NotificationDeviceDetail } from '../../../managements/models/notifications.model';

@Injectable()
export class NotificationDetailController {
	formatDate(value: string | null | undefined): string {
		if (!value) {
			return '-';
		}
		return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
	}

	getDisplayChannel(channel: string): string {
		const channels = this.getChannelValues(channel);
		if (channels.length === 0) {
			return '-';
		}
		return channels.map((value) => (value === 'PUSH' ? 'Push' : value === 'EMAIL' ? 'Email' : value === 'SMS' ? 'Message' : value)).join(', ');
	}

	getNotificationDestination(detail: NotificationDeviceDetail): string {
		return detail.address ?? detail.target ?? '-';
	}

	getNotificationRetryText(detail: NotificationDeviceDetail): string {
		return detail.retryCount.toString();
	}

	getNotificationStatusText(status: string): string {
		const normalized = status.toUpperCase();
		switch (normalized) {
			case 'SENT': return 'Đã gửi';
			case 'DELIVERED': return 'Đã gửi';
			case 'PENDING': return 'Đang chờ';
			case 'FAILED': return 'Thất bại';
			default: return status;
		}
	}

	getStatusDotColor(status: string): string {
		const normalized = status.toUpperCase();
		switch (normalized) {
			case 'SENT': return '#10b981';
			case 'DELIVERED': return '#10b981';
			case 'FAILED': return '#ef4444';
			case 'PENDING': return '#f59e0b';
			default: return '#cbd5e1';
		}
	}

	getStatusTextStyleColor(status: string): string {
		const normalized = status.toUpperCase();
		switch (normalized) {
			case 'SENT': return '#047857';
			case 'DELIVERED': return '#047857';
			case 'FAILED': return '#dc2626';
			case 'PENDING': return '#b45309';
			default: return '#475569';
		}
	}

	trackByDeviceDetailId(_: number, detail: NotificationDeviceDetail): number {
		return detail.id;
	}

	isFailedStatus(status: string | undefined): boolean {
		return status?.toUpperCase() === 'FAILED';
	}

	isRetryingDevice(detail: NotificationDeviceDetail, retryingDeviceId: string | null): boolean {
		if (!retryingDeviceId) {
			return false;
		}
		return (detail.deviceId ?? String(detail.id)) === retryingDeviceId;
	}

	private getChannelValues(channel: string): string[] {
		if (!channel) {
			return [];
		}
		return channel.split(',').map((item) => item.trim().toUpperCase()).filter((item) => item.length > 0);
	}
}