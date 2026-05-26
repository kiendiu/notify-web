import { createAction, props } from '@ngrx/store';
import {
  CampaignNotificationFilters,
  CampaignNotificationSearchResponse,
} from '../../models/notification.model';
import { NotificationSocketEvent } from '../../../core/websocket/websocket.models';

export const setActiveNotificationCampaign = createAction(
  '[Notification] Set Active Campaign',
  props<{ campaignId: string }>(),
);

export const clearNotificationState = createAction('[Notification] Clear State');

export const loadNotifications = createAction('[Notification] Load Notifications');

export const loadNotificationsSuccess = createAction(
  '[Notification] Load Notifications Success',
  props<{ response: CampaignNotificationSearchResponse }>(),
);

export const loadNotificationsFailure = createAction(
  '[Notification] Load Notifications Failure',
  props<{ errorMessage: string }>(),
);

export const setNotificationFilters = createAction(
  '[Notification] Set Filters',
  props<{ filters: Partial<CampaignNotificationFilters> }>(),
);

export const setNotificationPage = createAction(
  '[Notification] Set Page',
  props<{ page: number }>(),
);

export const retryNotification = createAction(
  '[Notification] Retry Notification',
  props<{ notificationId: string | number }>(),
);

export const retryNotificationSuccess = createAction(
  '[Notification] Retry Notification Success',
  props<{ notificationId: string | number }>(),
);

export const retryNotificationFailure = createAction(
  '[Notification] Retry Notification Failure',
  props<{ notificationId: string | number; errorMessage: string }>(),
);

export const connectNotificationRealtime = createAction('[Notification] Connect Realtime');

export const applyNotificationSocketEvents = createAction(
  '[Notification] Apply Socket Events',
  props<{ events: NotificationSocketEvent[] }>(),
);
