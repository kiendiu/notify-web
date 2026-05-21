import { createFeatureSelector, createSelector } from '@ngrx/store';
import { NotificationState } from './notification.state';

export const selectNotificationState = createFeatureSelector<NotificationState>('notifications');

export const selectActiveNotificationCampaignId = createSelector(
  selectNotificationState,
  (state) => state.activeCampaignId,
);

export const selectNotificationFilters = createSelector(
  selectNotificationState,
  (state) => state.filters,
);

export const selectNotificationPage = createSelector(
  selectNotificationState,
  (state) => state.page,
);

export const selectNotificationItems = createSelector(
  selectNotificationPage,
  (page) => page.items,
);

export const selectNotificationLoading = createSelector(
  selectNotificationState,
  (state) => state.loading,
);

export const selectNotificationError = createSelector(
  selectNotificationState,
  (state) => state.errorMessage,
);

export const selectRetryNotificationLoading = createSelector(
  selectNotificationState,
  (state) => state.retryLoading,
);

export const selectRetryNotificationError = createSelector(
  selectNotificationState,
  (state) => state.retryErrorMessage,
);
