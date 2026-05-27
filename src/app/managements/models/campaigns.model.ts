export type CampaignStatusFilter = 'ALL' | 'ACTIVE' | 'COMPLETED' | 'EXPIRED';

export type CampaignTargetType = 'ALL' | 'ACTIVE' | 'INACTIVE' | 'SPECIFIC';

export type CampaignStatus = Exclude<CampaignStatusFilter, 'ALL'>;

export type CampaignSortDirection = 'ASC' | 'DESC' | '';

export type CampaignChannel = 'PUSH' | 'EMAIL' | 'SMS';

export interface CampaignSentStatus {
	pending: number;
	failed: number;
	sent: number;
}

export interface CampaignSummary {
	id: string;
	name: string;
	status: string;
	channel: string;
	totalTarget: number;
	sentStatus: CampaignSentStatus;
	createdAt: string;
	scheduledTime?: string;
	endTime?: string | null;
}

export interface CampaignCreateResponse {
	id: number | string;
	name: string;
	ratePerHour: number;
	channel: string;
	status: string;
	priority?: number;
	templateName: string | null;
	pushTitle: string | null;
	pushBody: string | null;
	pushActionUrl: string | null;
	targetType: CampaignTargetType;
	scheduledTime: string;
	endTime: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface CampaignCreateRequest {
	name: string;
	targetType: CampaignTargetType;
	targetUserIds?: number[];
	channel: CampaignChannel[];
	ratePerHour: number;
	templateName: string | null;
	pushTitle: string | null;
	pushBody: string | null;
	pushActionUrl: string | null;
	scheduledTime: string;
	endTime: string | null;
}

export interface CampaignSearchFilters {
	campaignName: string;
	status: CampaignStatusFilter;
	sortDirection: CampaignSortDirection;
	page: number;
	size: number;
}

export interface CampaignPage {
	items: CampaignSummary[];
	number: number;
	size: number;
	totalElements: number;
	totalPages: number;
	first: boolean;
	last: boolean;
}

export interface CampaignSearchResponse {
	content?: CampaignSummary[];
	items?: CampaignSummary[];
	data?: CampaignSummary[];
	number?: number;
	size?: number;
	totalElements?: number;
	totalPages?: number;
	first?: boolean;
	last?: boolean;
}

export const defaultCampaignFilters: CampaignSearchFilters = {
	campaignName: '',
	status: 'ALL',
	sortDirection: '',
	page: 0,
	size: 10,
};

export const defaultCampaignPage: CampaignPage = {
	items: [],
	number: 0,
	size: 10,
	totalElements: 0,
	totalPages: 0,
	first: true,
	last: true,
};

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