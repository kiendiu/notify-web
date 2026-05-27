import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { bufferTime, catchError, filter, map, of, switchMap, withLatestFrom, tap, concat, EMPTY } from 'rxjs';
import { NotificationWsService } from '../../../core/websocket/notification-ws.service';
import { NotificationService } from '../../../services/notification.service';
import {
  selectActiveNotificationCampaignId,
  selectNotificationFilters,
} from './notification.selectors';
import * as NotificationActions from './notification.actions';
import { ClientCacheService } from '../../../core/cache/client-cache';
import { CacheScopes } from '../../../core/cache/cache-keys';
import { CACHE_TTL_MS } from '../../../core/cache/cache-policy';

@Injectable()
export class NotificationEffects {
  private readonly actions$ = inject(Actions);
  private readonly store = inject(Store);
  private readonly notificationService = inject(NotificationService);
  private readonly wsService = inject(NotificationWsService);
  private readonly clientCache = inject(ClientCacheService);

  loadNotifications$ = createEffect(() =>
    this.actions$.pipe(
      ofType(NotificationActions.loadNotifications),
      withLatestFrom(
        this.store.select(selectActiveNotificationCampaignId),
        this.store.select(selectNotificationFilters),
      ),
      filter(([, campaignId]) => Boolean(campaignId)),
      switchMap(([, campaignId, filters]) => {
        const cacheKey = this.clientCache.buildKey(CacheScopes.notifications, {
          campaignId: String(campaignId),
          channel: filters.channel ?? '',
          keyWord: filters.keyWord ?? '',
          page: filters.page,
          size: filters.size,
          status: filters.status ?? '',
        });
        const cachedEntry = this.clientCache.get<unknown>(cacheKey);
        const cachedResponse = cachedEntry?.value ?? null;
        const cached$ = cachedResponse
          ? of(NotificationActions.loadNotificationsSuccess({ response: cachedResponse as never }))
          : EMPTY;
        const shouldRevalidate = !this.clientCache.isFresh(cachedEntry, CACHE_TTL_MS.notifications);

        if (!shouldRevalidate && cachedResponse) {
          return cached$;
        }

        const network$ = this.notificationService.getCampaignNotifications(campaignId as string, filters).pipe(
          tap((response) => this.clientCache.set(cacheKey, response)),
          map((response) => NotificationActions.loadNotificationsSuccess({ response })),
          catchError(() =>
            cachedResponse
              ? EMPTY
              : of(
                  NotificationActions.loadNotificationsFailure({
                    errorMessage: 'Không thể tải danh sách thông báo. Vui lòng thử lại.',
                  }),
                ),
          ),
        );

        return concat(cached$, network$);
      }),
    ),
  );

  retryNotification$ = createEffect(() =>
    this.actions$.pipe(
      ofType(NotificationActions.retryNotification),
      switchMap(({ notificationId }) =>
        this.notificationService.retryNotification(notificationId).pipe(
          map(() => NotificationActions.retryNotificationSuccess({ notificationId })),
          catchError(() =>
            of(
              NotificationActions.retryNotificationFailure({
                notificationId,
                errorMessage: 'Không thể gửi lại thông báo. Vui lòng thử lại.',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  connectNotificationRealtime$ = createEffect(() =>
    this.actions$.pipe(
      ofType(NotificationActions.connectNotificationRealtime),
      switchMap(() =>
        this.wsService.watchNotifications().pipe(
          bufferTime(250),
          filter((events) => events.length > 0),
          tap((events) => console.info('[EFFECT][NOTIFICATIONS] received events ->', events)),
          map((events) => NotificationActions.applyNotificationSocketEvents({ events })),
          catchError(() => of(NotificationActions.clearNotificationState())),
        ),
      ),
    ),
  );
}
