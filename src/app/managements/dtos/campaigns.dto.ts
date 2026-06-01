import { CampaignChannel, CampaignPage, CampaignSummary, CampaignTargetType } from '../models/campaigns.model';

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

export type CampaignPageDto = CampaignPage;