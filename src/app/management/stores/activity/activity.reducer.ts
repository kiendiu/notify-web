import { createReducer, on } from '@ngrx/store';
import * as ActivityActions from './activity.actions';
import { initialActivityState } from './activity.state';

const MAX_ACTIVITIES = 4;

export const activityReducer = createReducer(
  initialActivityState,
  on(ActivityActions.loadRecentActivities, (state) => ({
    ...state,
    loading: true,
    errorMessage: null,
  })),
  on(ActivityActions.loadRecentActivitiesSuccess, (state, { items }) => ({
    ...state,
    loading: false,
    errorMessage: null,
    loaded: true,
    lastFetched: Date.now(),
    items: items.slice(0, MAX_ACTIVITIES),
  })),
  on(ActivityActions.loadRecentActivitiesFailure, (state, { errorMessage }) => ({
    ...state,
    loading: false,
    errorMessage,
  })),
  on(ActivityActions.appendRealtimeActivity, (state, { item }) => ({
    ...state,
    items: [item, ...state.items].slice(0, MAX_ACTIVITIES),
  })),
);
