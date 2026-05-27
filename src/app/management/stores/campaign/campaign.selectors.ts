import { createFeatureSelector, createSelector } from '@ngrx/store';
import { CampaignState } from './campaign.state';

export const selectCampaignState = createFeatureSelector<CampaignState>('campaigns');

export const selectCampaignFilters = createSelector(
  selectCampaignState,
  (state: CampaignState) => state.filters,
);

export const selectCampaignPage = createSelector(
  selectCampaignState,
  (state: CampaignState) => state.page,
);

export const selectCampaignItems = createSelector(
  selectCampaignPage,
  (page) => page.items,
);

export const selectCampaignLoading = createSelector(
  selectCampaignState,
  (state: CampaignState) => state.loading,
);

export const selectCampaignError = createSelector(
  selectCampaignState,
  (state: CampaignState) => state.errorMessage,
);