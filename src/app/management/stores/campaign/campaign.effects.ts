import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of, withLatestFrom } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import * as CampaignActions from './campaign.actions';
import { CampaignService } from '../../../services/campaign.service';
import { selectCampaignFilters } from './campaign.selectors';

@Injectable()
export class CampaignEffects {
  private readonly actions$ = inject(Actions);
  private readonly store = inject(Store);
  private readonly campaignService = inject(CampaignService);

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
          map(() => CampaignActions.createCampaignSuccess()),
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
}