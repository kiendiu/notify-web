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

export interface CampaignPage {
	items: CampaignSummary[];
	number: number;
	size: number;
	totalElements: number;
	totalPages: number;
	first: boolean;
	last: boolean;
}
