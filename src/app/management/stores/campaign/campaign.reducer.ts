import { createReducer, on } from '@ngrx/store';
import * as CampaignActions from './campaign.actions';
import { initialCampaignState } from './campaign.state';
import { normalizeCampaignPage } from '../../models/campaign.model';

export const campaignReducer = createReducer(
  initialCampaignState,
  on(CampaignActions.loadCampaigns, (state) => ({
    ...state,
    loading: true,
    errorMessage: null,
  })),
  on(CampaignActions.loadCampaignsSuccess, (state, { response }) => ({
    ...state,
    loading: false,
    page: normalizeCampaignPage(response),
    errorMessage: null,
  })),
  on(CampaignActions.loadCampaignsFailure, (state, { errorMessage }) => ({
    ...state,
    loading: false,
    errorMessage,
  })),
  on(CampaignActions.setCampaignStatus, (state, { status }) => ({
    ...state,
    filters: {
      ...state.filters,
      status,
      page: 0,
    },
  })),
  on(CampaignActions.setCampaignSortDirection, (state, { sortDirection }) => ({
    ...state,
    filters: {
      ...state.filters,
      sortDirection,
      page: 0,
    },
  })),
  on(CampaignActions.setCampaignName, (state, { campaignName }) => ({
    ...state,
    filters: {
      ...state.filters,
      campaignName,
      page: 0,
    },
  })),
  on(CampaignActions.setCampaignPage, (state, { page }) => ({
    ...state,
    filters: {
      ...state.filters,
      page,
    },
  })),
  on(CampaignActions.setCampaignSize, (state, { size }) => ({
    ...state,
    filters: {
      ...state.filters,
      size,
      page: 0,
    },
  })),
);