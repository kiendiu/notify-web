import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { EMPTY, of, withLatestFrom } from 'rxjs';
import { catchError, filter, map, switchMap } from 'rxjs/operators';
import * as CampaignActions from './campaign.actions';
import { NotificationWsService } from '../../../core/websocket/notification-ws.service';
import { CampaignService } from '../../../services/campaign.service';
import { selectCampaignFilters } from './campaign.selectors';

@Injectable()
export class CampaignEffects {
  private readonly actions$ = inject(Actions);
  private readonly store = inject(Store);
  private readonly campaignService = inject(CampaignService);
  private readonly wsService = inject(NotificationWsService);

  loadCampaigns$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CampaignActions.loadCampaigns),
      withLatestFrom(this.store.select(selectCampaignFilters)),
      switchMap(([, filters]) =>
        this.campaignService.searchCampaigns(filters).pipe(
          map((response) => CampaignActions.loadCampaignsSuccess({ response })),
          catchError(() =>
            of(
              CampaignActions.loadCampaignsFailure({
                errorMessage: 'Không thể tải danh sách chiến dịch. Vui lòng thử lại.',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  createCampaign$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CampaignActions.createCampaign),
      switchMap(({ request }) =>
        this.campaignService.createCampaign(request).pipe(
          map(() => CampaignActions.createCampaignSuccess({ request })),
          catchError(() =>
            of(
              CampaignActions.createCampaignFailure({
                errorMessage: 'Không thể tạo chiến dịch. Vui lòng thử lại.',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  connectCampaignRealtime$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CampaignActions.connectCampaignRealtime),
      switchMap(() =>
        this.wsService.watchCampaigns().pipe(
          filter((event) => {
            if ('action' in event) {
              return event.action === 'UPDATE_CAMPAIGN_STATS';
            }
            return true;
          }),
          map((event) => CampaignActions.applyCampaignSocketEvent({ event })),
          catchError(() => EMPTY),
        ),
      ),
    ),
  );
}