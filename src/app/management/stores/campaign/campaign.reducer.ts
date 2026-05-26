import { createReducer, on } from '@ngrx/store';
import * as CampaignActions from './campaign.actions';
import { initialCampaignState } from './campaign.state';
import { CampaignSummary, normalizeCampaignPage } from '../../models/campaign.model';
import { CampaignLegacySocketEvent, CampaignSocketEvent } from '../../../core/websocket/websocket.models';

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
    loaded: true,
    lastFetched: Date.now(),
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
  on(CampaignActions.applyCampaignSocketEvent, (state, { event }) => {
    const nextItems = state.page.items.map((item) => updateCampaignBySocket(item, event));
    const hasChanged = nextItems.some((item, index) => item !== state.page.items[index]);

    if (!hasChanged) {
      return state;
    }

    return {
      ...state,
      page: {
        ...state.page,
        items: nextItems,
      },
    };
  }),
);

function updateCampaignBySocket(
  campaign: CampaignSummary,
  event: CampaignSocketEvent | CampaignLegacySocketEvent,
): CampaignSummary {
  if (isLegacyEvent(event)) {
    if (String(campaign.id) !== String(event.campaignId)) {
      return campaign;
    }
    return {
      ...campaign,
      status: event.status,
    };
  }

  const candidateId = event.data?.id ?? event.campaignId;
  if (String(campaign.id) !== String(candidateId)) {
    return campaign;
  }

  const sentStatus = event.data?.sentStatus;
  return {
    ...campaign,
    ...event.data,
    id: String(event.data?.id ?? event.campaignId),
    status: event.data?.status ?? campaign.status,
    sentStatus: sentStatus
      ? {
          sent: sentStatus.sent,
          failed: sentStatus.failed,
          pending: sentStatus.pending,
        }
      : campaign.sentStatus,
  };
}

function isLegacyEvent(event: CampaignSocketEvent | CampaignLegacySocketEvent): event is CampaignLegacySocketEvent {
  return !('action' in event);
}