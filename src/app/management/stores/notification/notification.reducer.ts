import { createReducer, on } from '@ngrx/store';
import { normalizeNotificationPage } from '../../models/notification.model';
import { NotificationSocketEvent } from '../../../core/websocket/websocket.models';
import * as NotificationActions from './notification.actions';
import { initialNotificationState } from './notification.state';

export const notificationReducer = createReducer(
  initialNotificationState,
  on(NotificationActions.setActiveNotificationCampaign, (state, { campaignId }) => ({
    ...state,
    activeCampaignId: campaignId,
    filters: {
      ...state.filters,
      page: 0,
    },
    page: {
      ...state.page,
      number: 0,
    },
    errorMessage: null,
  })),
  on(NotificationActions.clearNotificationState, () => ({
    ...initialNotificationState,
  })),
  on(NotificationActions.setNotificationFilters, (state, { filters }) => ({
    ...state,
    filters: {
      ...state.filters,
      ...filters,
    },
    page: {
      ...state.page,
      items: [],
      number: 0,
    },
  })),
  on(NotificationActions.setNotificationPage, (state, { page }) => ({
    ...state,
    filters: {
      ...state.filters,
      page,
    },
    page: {
      ...state.page,
      items: [],
      number: page,
    },
  })),
  on(NotificationActions.loadNotifications, (state) => ({
    ...state,
    loading: true,
    errorMessage: null,
  })),
  on(NotificationActions.loadNotificationsSuccess, (state, { response }) => {
    const normalized = normalizeNotificationPage(response);
    const mergedItems = mergeNotificationItems(state.page.items, normalized.items);
    return {
      ...state,
      loading: false,
      errorMessage: null,
      page: {
        ...normalized,
        items: mergedItems,
        totalElements: Math.max(normalized.totalElements, mergedItems.length),
      },
      filters: {
        ...state.filters,
        page: normalized.number,
        size: normalized.size,
      },
    };
  }),
  on(NotificationActions.loadNotificationsFailure, (state, { errorMessage }) => ({
    ...state,
    loading: false,
    errorMessage,
  })),
  on(NotificationActions.retryNotification, (state) => ({
    ...state,
    retryLoading: true,
    retryErrorMessage: null,
  })),
  on(NotificationActions.retryNotificationSuccess, (state) => ({
    ...state,
    retryLoading: false,
    retryErrorMessage: null,
  })),
  on(NotificationActions.retryNotificationFailure, (state, { errorMessage }) => ({
    ...state,
    retryLoading: false,
    retryErrorMessage: errorMessage,
  })),
  on(NotificationActions.applyNotificationSocketEvents, (state, { events }) => {
    if (events.length === 0 || !state.activeCampaignId) {
      return state;
    }

    const nextItems = applySocketEvents(state.page.items, state.activeCampaignId, events);
    if (nextItems === state.page.items) {
      return state;
    }

    return {
      ...state,
      page: {
        ...state.page,
        items: nextItems,
        totalElements: Math.max(nextItems.length, state.page.totalElements),
      },
    };
  }),
);

function applySocketEvents(
  items: typeof initialNotificationState.page.items,
  activeCampaignId: string,
  events: NotificationSocketEvent[],
): typeof initialNotificationState.page.items {
  let updated = items;

  for (const event of events) {
    const payload = event.data;
    if (!payload) {
      continue;
    }

    const payloadCampaignId = payload.campaignId != null ? String(payload.campaignId) : null;
    if (payloadCampaignId && payloadCampaignId !== activeCampaignId) {
      continue;
    }

    const action = (event.action ?? '').toUpperCase();
    if (action === 'CREATE') {
      const existingIndex = updated.findIndex((item) => item.id === payload.id);
      if (existingIndex === -1) {
        updated = [payload, ...updated];
      } else {
        const existing = updated[existingIndex];
        const merged = { ...existing, ...payload };
        updated = [
          merged,
          ...updated.slice(0, existingIndex),
          ...updated.slice(existingIndex + 1),
        ];
      }
      continue;
    }

    if (action === 'UPDATE') {
      const index = updated.findIndex((item) => item.id === payload.id);
      if (index === -1) {
        continue;
      }
      const current = updated[index];
      updated = [
        ...updated.slice(0, index),
        { ...current, ...payload },
        ...updated.slice(index + 1),
      ];
    }
  }

  return updated;
}

function mergeNotificationItems(
  existingItems: typeof initialNotificationState.page.items,
  loadedItems: typeof initialNotificationState.page.items,
): typeof initialNotificationState.page.items {
  if (existingItems.length === 0) {
    return loadedItems;
  }

  const merged = [...loadedItems];

  for (const item of existingItems) {
    const index = merged.findIndex((candidate) => candidate.id === item.id);
    if (index === -1) {
      merged.unshift(item);
      continue;
    }

    merged[index] = {
      ...merged[index],
      ...item,
    };
  }

  return merged;
}
