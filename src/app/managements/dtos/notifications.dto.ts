import { CampaignNotificationSummary, NotificationDeviceDetail } from '../models/notifications.model';

export interface CampaignNotificationSearchResponse {
	content?: CampaignNotificationSummary[];
	number?: number;
	size?: number;
	totalElements?: number;
	totalPages?: number;
	first?: boolean;
	last?: boolean;
}

export type NotificationDetailsResponse = NotificationDeviceDetail | NotificationDeviceDetail[];