import { CampaignNotificationPage, NotificationDeviceDetail } from '../models/notifications.model';
import { CampaignNotificationSearchResponse, NotificationDetailsResponse } from '../dtos/notifications.dto';

export function normalizeNotificationPage(response: CampaignNotificationSearchResponse): CampaignNotificationPage {
	const items = response.content ?? [];
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

export function normalizeNotificationDetails(response: NotificationDetailsResponse): NotificationDeviceDetail[] {
	if (!response) {
		return [];
	}

	return Array.isArray(response) ? response : [response];
}