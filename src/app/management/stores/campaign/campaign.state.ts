import {
  CampaignPage,
  CampaignSearchFilters,
  defaultCampaignFilters,
  defaultCampaignPage,
} from '../../models/campaign.model';

export interface CampaignState {
  filters: CampaignSearchFilters;
  page: CampaignPage;
  loading: boolean;
  errorMessage: string | null;
}

export const initialCampaignState: CampaignState = {
  filters: defaultCampaignFilters,
  page: defaultCampaignPage,
  loading: false,
  errorMessage: null,
};