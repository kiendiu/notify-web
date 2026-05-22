import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Action } from '@ngrx/store';
import { filter, map, tap } from 'rxjs/operators';
import * as PreviewActions from '../../management/stores/preview/preview.actions';
import * as CampaignActions from '../../management/stores/campaign/campaign.actions';
import * as NotificationActions from '../../management/stores/notification/notification.actions';
import * as ActivityActions from '../../management/stores/activity/activity.actions';
import { StoreSyncService } from './store-sync.service';

@Injectable()
export class StoreSyncEffects {
  private readonly actions$ = inject(Actions);
  private readonly storeSync = inject(StoreSyncService);

  broadcastActions$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(
          PreviewActions.loadTemplatesSuccess,
          PreviewActions.searchUsersSuccess,
          CampaignActions.loadCampaignsSuccess,
          CampaignActions.applyCampaignSocketEvent,
          NotificationActions.loadNotificationsSuccess,
          NotificationActions.applyNotificationSocketEvents,
          NotificationActions.retryNotificationSuccess,
          ActivityActions.loadRecentActivitiesSuccess,
          ActivityActions.appendRealtimeActivity,
        ),
        filter((action: Action & { meta?: { sourceId?: string } }) => !action.meta?.sourceId),
        tap((action) => this.storeSync.publish(action)),
      ),
    { dispatch: false },
  );

  applyRemoteActions$ = createEffect(() =>
    this.storeSync.messages$.pipe(
      map((envelope) => ({
        ...envelope.action,
        meta: {
          ...(envelope.action as Action & { meta?: { sourceId?: string } }).meta,
          sourceId: envelope.sourceId,
        },
      })),
    ),
  );
}
