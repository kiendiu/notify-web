import {
  CampaignNotificationFilters,
  CampaignNotificationPage,
  defaultNotificationFilters,
  defaultNotificationPage,
} from '../../models/notification.model';

export interface NotificationState {
  activeCampaignId: string | null;
  filters: CampaignNotificationFilters;
  page: CampaignNotificationPage;
  loading: boolean;
  loaded: boolean;
  lastFetched: number | null;
  errorMessage: string | null;
  retryLoading: boolean;
  retryingNotificationId: string | number | null;
  retryErrorMessage: string | null;
}

export const initialNotificationState: NotificationState = {
  activeCampaignId: null,
  filters: defaultNotificationFilters,
  page: defaultNotificationPage,
  loading: false,
  loaded: false,
  lastFetched: null,
  errorMessage: null,
  retryLoading: false,
  retryingNotificationId: null,
  retryErrorMessage: null,
};
