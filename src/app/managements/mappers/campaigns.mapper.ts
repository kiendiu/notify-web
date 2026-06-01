import { CampaignPage } from '../models/campaigns.model';
import { CampaignSearchResponse } from '../dtos/campaigns.dto';

export function normalizeCampaignPage(response: CampaignSearchResponse): CampaignPage {
	const items = response.content ?? response.items ?? response.data ?? [];
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