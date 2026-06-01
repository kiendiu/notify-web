export type NotificationChannelFilter = '' | 'push' | 'email' | 'sms';

export type NotificationStatusFilter = '' | 'sent' | 'pending' | 'failed';

export interface CampaignNotificationFilters {
	channel: NotificationChannelFilter;
	status: NotificationStatusFilter;
	keyWord: string;
	page: number;
	size: number;
}

export const defaultNotificationFilters: CampaignNotificationFilters = {
	channel: '',
	status: '',
	keyWord: '',
	page: 0,
	size: 10,
};