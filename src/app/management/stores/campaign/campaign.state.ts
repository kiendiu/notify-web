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
  loaded: boolean;
  lastFetched: number | null;
  errorMessage: string | null;
}

export const initialCampaignState: CampaignState = {
  filters: defaultCampaignFilters,
  page: defaultCampaignPage,
  loading: false,
  loaded: false,
  lastFetched: null,
  errorMessage: null,
};