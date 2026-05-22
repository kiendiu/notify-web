import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { EMPTY, concat, of, withLatestFrom } from 'rxjs';
import { catchError, filter, map, switchMap, tap } from 'rxjs/operators';
import * as CampaignActions from './campaign.actions';
import { NotificationWsService } from '../../../core/websocket/notification-ws.service';
import { CampaignService } from '../../../services/campaign.service';
import { selectCampaignFilters } from './campaign.selectors';
import { ClientCacheService } from '../../../core/cache/client-cache';
import { CacheScopes } from '../../../core/cache/cache-keys';
import { CACHE_TTL_MS } from '../../../core/cache/cache-policy';

@Injectable()
export class CampaignEffects {
  private readonly actions$ = inject(Actions);
  private readonly store = inject(Store);
  private readonly campaignService = inject(CampaignService);
  private readonly wsService = inject(NotificationWsService);
  private readonly clientCache = inject(ClientCacheService);

  loadCampaigns$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CampaignActions.loadCampaigns),
      withLatestFrom(this.store.select(selectCampaignFilters)),
      switchMap(([, filters]) => {
        const cacheKey = this.clientCache.buildKey(CacheScopes.campaigns, {
          campaignName: filters.campaignName.trim(),
          page: filters.page,
          size: filters.size,
          sortDirection: filters.sortDirection,
          status: filters.status,
        });
        const cachedEntry = this.clientCache.get<unknown>(cacheKey);
        const cachedResponse = cachedEntry?.value ?? null;
        const cached$ = cachedResponse
          ? of(CampaignActions.loadCampaignsSuccess({ response: cachedResponse as never }))
          : EMPTY;
        const shouldRevalidate = !this.clientCache.isFresh(cachedEntry, CACHE_TTL_MS.campaigns);

        if (!shouldRevalidate && cachedResponse) {
          return cached$;
        }

        const network$ = this.campaignService.searchCampaigns(filters).pipe(
          tap((response) => this.clientCache.set(cacheKey, response)),
          map((response) => CampaignActions.loadCampaignsSuccess({ response })),
          catchError(() =>
            cachedResponse
              ? EMPTY
              : of(
                  CampaignActions.loadCampaignsFailure({
                    errorMessage: 'Không thể tải danh sách chiến dịch. Vui lòng thử lại.',
                  }),
                ),
          ),
        );

        return concat(cached$, network$);
      }),
    ),
  );

  createCampaign$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CampaignActions.createCampaign),
      switchMap(({ request }) =>
        this.campaignService.createCampaign(request).pipe(
          map((campaign) => CampaignActions.createCampaignSuccess({ campaign })),
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