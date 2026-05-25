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
      loaded: true,
      lastFetched: Date.now(),
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
  on(NotificationActions.retryNotification, (state, { notificationId }) => ({
    ...state,
    retryLoading: true,
    retryingNotificationId: notificationId,
    retryErrorMessage: null,
    page: {
      ...state.page,
      items: updateNotificationStatus(state.page.items, notificationId, 'PENDING'),
    },
  })),
  on(NotificationActions.retryNotificationSuccess, (state) => ({
    ...state,
    retryErrorMessage: null,
  })),
  on(NotificationActions.retryNotificationFailure, (state, { notificationId, errorMessage }) => ({
    ...state,
    retryLoading: false,
    retryingNotificationId:
      state.retryingNotificationId === notificationId ? null : state.retryingNotificationId,
    retryErrorMessage: errorMessage,
    page: {
      ...state.page,
      items: updateNotificationStatus(state.page.items, notificationId, 'FAILED'),
    },
  })),
  on(NotificationActions.applyNotificationSocketEvents, (state, { events }) => {
    if (events.length === 0 || !state.activeCampaignId) {
      return state;
    }

    const nextItems = applySocketEvents(state.page.items, state.activeCampaignId, events);
    const nextRetryingNotificationId = shouldClearRetryingNotificationId(
      state.retryingNotificationId,
      events,
    )
      ? null
      : state.retryingNotificationId;

    if (nextItems === state.page.items && nextRetryingNotificationId === state.retryingNotificationId) {
      return state;
    }

    return {
      ...state,
      retryLoading: nextRetryingNotificationId !== null,
      retryingNotificationId: nextRetryingNotificationId,
      retryErrorMessage: nextRetryingNotificationId === null ? null : state.retryErrorMessage,
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
        updated = [...updated, payload];
      } else {
        const existing = updated[existingIndex];
        const merged = { ...existing, ...payload };
        updated = [
          ...updated.slice(0, existingIndex),
          merged,
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

  const merged: typeof loadedItems = loadedItems.map((loaded) => {
    const existing = existingItems.find((e) => e.id === loaded.id);
    return existing ? { ...loaded, ...existing } : loaded;
  });
  const missing = existingItems.filter((e) => !loadedItems.some((l) => l.id === e.id));
  if (missing.length > 0) {
    merged.push(...missing);
  }

  return merged;
}

function updateNotificationStatus(
  items: typeof initialNotificationState.page.items,
  notificationId: string | number,
  status: string,
): typeof initialNotificationState.page.items {
  const targetId = String(notificationId);
  let updated = false;

  const nextItems = items.map((item) => {
    if (String(item.id) !== targetId) {
      return item;
    }

    updated = true;
    return {
      ...item,
      status,
    };
  });

  return updated ? nextItems : items;
}

function shouldClearRetryingNotificationId(
  retryingNotificationId: string | number | null,
  events: NotificationSocketEvent[],
): boolean {
  if (retryingNotificationId === null) {
    return false;
  }

  const targetId = String(retryingNotificationId);
  return events.some((event) => {
    const payloadId = event.data?.id;
    return payloadId !== undefined && String(payloadId) === targetId;
  });
}
