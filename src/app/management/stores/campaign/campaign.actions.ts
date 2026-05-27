import { createAction, props } from '@ngrx/store';
import { CampaignCreateRequest, CampaignCreateResponse, CampaignSearchResponse, CampaignSortDirection, CampaignStatusFilter } from '../../models/campaign.model';
import { CampaignLegacySocketEvent, CampaignSocketEvent } from '../../../core/websocket/websocket.models';

export const loadCampaigns = createAction('[Campaign] Load Campaigns');

export const loadCampaignsSuccess = createAction(
  '[Campaign] Load Campaigns Success',
  props<{ response: CampaignSearchResponse }>(),
);

export const loadCampaignsFailure = createAction(
  '[Campaign] Load Campaigns Failure',
  props<{ errorMessage: string }>(),
);

export const setCampaignStatus = createAction(
  '[Campaign] Set Status',
  props<{ status: CampaignStatusFilter }>(),
);

export const setCampaignSortDirection = createAction(
  '[Campaign] Set Sort Direction',
  props<{ sortDirection: CampaignSortDirection }>(),
);

export const setCampaignName = createAction(
  '[Campaign] Set Campaign Name',
  props<{ campaignName: string }>(),
);

export const setCampaignPage = createAction(
  '[Campaign] Set Page',
  props<{ page: number }>(),
);

export const setCampaignSize = createAction(
  '[Campaign] Set Size',
  props<{ size: number }>(),
);

export const createCampaign = createAction(
  '[Campaign] Create Campaign',
  props<{ request: CampaignCreateRequest }>(),
);

export const createCampaignSuccess = createAction(
  '[Campaign] Create Campaign Success',
  props<{ campaign: CampaignCreateResponse }>(),
);

export const createCampaignFailure = createAction(
  '[Campaign] Create Campaign Failure',
  props<{ errorMessage: string }>(),
);

export const connectCampaignRealtime = createAction('[Campaign] Connect Realtime');

export const applyCampaignSocketEvent = createAction(
  '[Campaign] Apply Socket Event',
  props<{ event: CampaignSocketEvent | CampaignLegacySocketEvent }>(),
);