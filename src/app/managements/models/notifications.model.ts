export type NotificationChannel = 'PUSH' | 'EMAIL' | 'SMS';

export type NotificationStatus = 'SENT' | 'PENDING' | 'FAILED' | 'DELIVERED';

export interface CampaignNotificationSummary {
	id: number;
	userId: string;
	userName: string;
	channel: NotificationChannel | string;
	status: NotificationStatus | string;
	title: string;
	body: string;
	sentAt: string | null;
	isRead: boolean;
	isDeleted: boolean;
	count: number;
	Count?: number;
}

export interface CampaignNotificationPage {
	items: CampaignNotificationSummary[];
	number: number;
	size: number;
	totalElements: number;
	totalPages: number;
	first: boolean;
	last: boolean;
}

export interface NotificationDeviceDetail {
	id: number;
	deviceId?: string;
	address?: string;
	target?: string;
	deviceName: string | null;
	status: NotificationStatus | string;
	retryCount: number;
	errorMessage: string | null;
	updatedAt: string;
}

export interface NotificationDeviceStatusUpdateEvent {
	event: 'DEVICE_STATUS_UPDATE' | string;
	deviceId: string;
	status: NotificationStatus | string;
	errorMessage?: string | null;
	latestLogId?: number | string | null;
}
