import { CampaignSortDirection, CampaignStatusFilter } from '../models/campaigns.model';

export interface CampaignSearchFilters {
	campaignName: string;
	status: CampaignStatusFilter;
	sortDirection: CampaignSortDirection;
	page: number;
	size: number;
}

export const defaultCampaignFilters: CampaignSearchFilters = {
	campaignName: '',
	status: 'ALL',
	sortDirection: '',
	page: 0,
	size: 10,
};