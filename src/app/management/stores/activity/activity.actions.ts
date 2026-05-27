import { createAction, props } from '@ngrx/store';
import { ActivitySocketEvent } from '../../../core/websocket/websocket.models';

export const loadRecentActivities = createAction('[Activity] Load Recent Activities');

export const loadRecentActivitiesSuccess = createAction(
  '[Activity] Load Recent Activities Success',
  props<{ items: ActivitySocketEvent[] }>(),
);

export const loadRecentActivitiesFailure = createAction(
  '[Activity] Load Recent Activities Failure',
  props<{ errorMessage: string }>(),
);

export const connectActivityRealtime = createAction('[Activity] Connect Realtime');

export const appendRealtimeActivity = createAction(
  '[Activity] Append Realtime Activity',
  props<{ item: ActivitySocketEvent }>(),
);
