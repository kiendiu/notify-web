import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { bufferTime, catchError, concat, filter, map, of, switchMap, EMPTY, tap } from 'rxjs';
import { NotificationWsService } from '../../../core/websocket/notification-ws.service';
import { NotificationService } from '../../../services/notification.service';
import * as ActivityActions from './activity.actions';
import { ClientCacheService } from '../../../core/cache/client-cache';
import { CacheScopes } from '../../../core/cache/cache-keys';
import { CACHE_TTL_MS } from '../../../core/cache/cache-policy';

@Injectable()
export class ActivityEffects {
  private readonly actions$ = inject(Actions);
  private readonly notificationService = inject(NotificationService);
  private readonly wsService = inject(NotificationWsService);
  private readonly clientCache = inject(ClientCacheService);

  loadRecentActivities$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ActivityActions.loadRecentActivities),
      switchMap(() => {
        const cacheKey = this.clientCache.buildKey(CacheScopes.activities);
        const cachedEntry = this.clientCache.get<unknown[]>(cacheKey);
        const cachedItems = cachedEntry?.value ?? [];
        const cached$ = cachedItems.length > 0
          ? of(ActivityActions.loadRecentActivitiesSuccess({ items: cachedItems as never[] }))
          : EMPTY;
        const shouldRevalidate = !this.clientCache.isFresh(cachedEntry, CACHE_TTL_MS.activities);

        if (!shouldRevalidate && cachedItems.length > 0) {
          return cached$;
        }

        const network$ = this.notificationService.getRecentActivities().pipe(
          tap((items) => this.clientCache.set(cacheKey, items)),
          map((items) => ActivityActions.loadRecentActivitiesSuccess({ items })),
          catchError(() =>
            cachedItems.length > 0
              ? EMPTY
              : of(
                  ActivityActions.loadRecentActivitiesFailure({
                    errorMessage: 'Không thể tải hoạt động gần đây.',
                  }),
                ),
          ),
        );

        return concat(cached$, network$);
      }),
    ),
  );

  connectActivityRealtime$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ActivityActions.connectActivityRealtime),
      switchMap(() =>
        this.wsService.watchActivities().pipe(
          bufferTime(300),
          map((items) => items.filter((item) => Boolean(item?.message && item?.timestamp))),
          filter((items) => items.length > 0),
          switchMap((items) => items.map((item) => ActivityActions.appendRealtimeActivity({ item }))),
          catchError(() => of(ActivityActions.loadRecentActivitiesFailure({ errorMessage: 'Mất kết nối realtime activities.' }))),
        ),
      ),
    ),
  );
}
