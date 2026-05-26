import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ActivityState } from './activity.state';

export const selectActivityState = createFeatureSelector<ActivityState>('activities');

export const selectActivityItems = createSelector(
  selectActivityState,
  (state) => state.items,
);

export const selectActivityLoading = createSelector(
  selectActivityState,
  (state) => state.loading,
);

export const selectActivityError = createSelector(
  selectActivityState,
  (state) => state.errorMessage,
);
