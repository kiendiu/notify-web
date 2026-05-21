import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { bufferTime, catchError, filter, map, of, switchMap } from 'rxjs';
import { NotificationWsService } from '../../../core/websocket/notification-ws.service';
import { NotificationService } from '../../../services/notification.service';
import * as ActivityActions from './activity.actions';

@Injectable()
export class ActivityEffects {
  private readonly actions$ = inject(Actions);
  private readonly notificationService = inject(NotificationService);
  private readonly wsService = inject(NotificationWsService);

  loadRecentActivities$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ActivityActions.loadRecentActivities),
      switchMap(() =>
        this.notificationService.getRecentActivities().pipe(
          map((items) => ActivityActions.loadRecentActivitiesSuccess({ items })),
          catchError(() =>
            of(
              ActivityActions.loadRecentActivitiesFailure({
                errorMessage: 'Không thể tải hoạt động gần đây.',
              }),
            ),
          ),
        ),
      ),
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
