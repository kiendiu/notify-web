import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { bufferTime, catchError, filter, map, mergeMap, of, switchMap, withLatestFrom, tap } from 'rxjs';
import { NotificationWsService } from '../../../core/websocket/notification-ws.service';
import { NotificationService } from '../../../services/notification.service';
import {
  selectActiveNotificationCampaignId,
  selectNotificationFilters,
} from './notification.selectors';
import * as NotificationActions from './notification.actions';

@Injectable()
export class NotificationEffects {
  private readonly actions$ = inject(Actions);
  private readonly store = inject(Store);
  private readonly notificationService = inject(NotificationService);
  private readonly wsService = inject(NotificationWsService);

  loadNotifications$ = createEffect(() =>
    this.actions$.pipe(
      ofType(NotificationActions.loadNotifications),
      withLatestFrom(
        this.store.select(selectActiveNotificationCampaignId),
        this.store.select(selectNotificationFilters),
      ),
      filter(([, campaignId]) => Boolean(campaignId)),
      switchMap(([, campaignId, filters]) =>
        this.notificationService.getCampaignNotifications(campaignId as string, filters).pipe(
          map((response) => NotificationActions.loadNotificationsSuccess({ response })),
          catchError(() =>
            of(
              NotificationActions.loadNotificationsFailure({
                errorMessage: 'Không thể tải danh sách thông báo. Vui lòng thử lại.',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  retryNotification$ = createEffect(() =>
    this.actions$.pipe(
      ofType(NotificationActions.retryNotification),
      switchMap(({ notificationId }) =>
        this.notificationService.retryNotification(notificationId).pipe(
          map(() => NotificationActions.retryNotificationSuccess()),
          catchError(() =>
            of(
              NotificationActions.retryNotificationFailure({
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

  reloadAfterRetrySuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(NotificationActions.retryNotificationSuccess),
      map(() => NotificationActions.loadNotifications()),
    ),
  );
}
