import { CampaignSummary } from '../../managements/models/campaigns.model';
import { CampaignNotificationSummary } from '../../managements/models/notifications.model';
import { WebSocketEnvelope } from './websocket.types';

export interface NotificationSocketEventData extends CampaignNotificationSummary {
  campaignId?: number | string;
  errorMessage?: string | null;
}

export type NotificationSocketEvent = WebSocketEnvelope<NotificationSocketEventData>;

export interface CampaignSocketStats {
  id: string | number;
  name?: string;
  status: string;
  totalTarget?: number;
  sentStatus?: {
    sent: number;
    failed: number;
    pending: number;
  };
  scheduledTime?: string;
  endTime?: string | null;
}

export interface CampaignSocketEvent {
  action: 'UPDATE_CAMPAIGN_STATS' | string;
  campaignId: number | string;
  data: CampaignSocketStats | CampaignSummary;
}

export interface ActivitySocketEvent {
  type: string;
  message: string;
  timestamp: number;
}

export interface CampaignLegacySocketEvent {
  campaignId: string;
  status: string;
}
