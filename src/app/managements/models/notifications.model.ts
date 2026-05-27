export type NotificationChannelFilter = '' | 'push' | 'email' | 'sms';

export type NotificationStatusFilter = '' | 'sent' | 'pending' | 'failed';

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

export interface CampaignNotificationFilters {
	channel: NotificationChannelFilter;
	status: NotificationStatusFilter;
	keyWord: string;
	page: number;
	size: number;
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

export interface CampaignNotificationSearchResponse {
	content?: CampaignNotificationSummary[];
	number?: number;
	size?: number;
	totalElements?: number;
	totalPages?: number;
	first?: boolean;
	last?: boolean;
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

export type NotificationDetailsResponse = NotificationDeviceDetail | NotificationDeviceDetail[];

export const defaultNotificationFilters: CampaignNotificationFilters = {
	channel: '',
	status: '',
	keyWord: '',
	page: 0,
	size: 10,
};

export const defaultNotificationPage: CampaignNotificationPage = {
	items: [],
	number: 0,
	size: 10,
	totalElements: 0,
	totalPages: 0,
	first: true,
	last: true,
};

export function normalizeNotificationPage(
	response: CampaignNotificationSearchResponse,
): CampaignNotificationPage {
	const items = response.content ?? (response as { items?: CampaignNotificationSummary[] }).items ?? (response as { data?: CampaignNotificationSummary[] }).data ?? [];
	const size = response.size ?? (items.length > 0 ? items.length : 10);
	const totalElements = response.totalElements ?? items.length;
	const totalPages = response.totalPages ?? (size > 0 ? Math.ceil(totalElements / size) : 0);
	const pageNumber = response.number ?? 0;

	return {
		items,
		number: pageNumber,
		size,
		totalElements,
		totalPages,
		first: response.first ?? pageNumber === 0,
		last: response.last ?? pageNumber >= Math.max(totalPages - 1, 0),
	};
}

export function normalizeNotificationDetails(
	response: NotificationDetailsResponse,
): NotificationDeviceDetail[] {
	if (!response) {
		return [];
	}

	return Array.isArray(response) ? response : [response];
}