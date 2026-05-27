import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { EMPTY, concat, of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import * as PreviewActions from './preview.actions';
import { PreviewService } from '../../../services/preview.service';
import { ClientCacheService } from '../../../core/cache/client-cache';
import { CacheScopes } from '../../../core/cache/cache-keys';
import { CACHE_TTL_MS } from '../../../core/cache/cache-policy';

@Injectable()
export class PreviewEffects {
  private readonly actions$ = inject(Actions);
  private readonly previewService = inject(PreviewService);
  private readonly clientCache = inject(ClientCacheService);

  loadTemplates$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PreviewActions.loadTemplates),
      switchMap(() => {
        const cacheKey = this.clientCache.buildKey(CacheScopes.previewTemplates);
        const cachedEntry = this.clientCache.get<ReturnType<typeof PreviewActions.loadTemplatesSuccess> extends { templates: infer T } ? T : never>(cacheKey);
        const cachedTemplates = cachedEntry?.value ?? null;
        const cached$ = cachedTemplates
          ? of(PreviewActions.loadTemplatesSuccess({ templates: cachedTemplates }))
          : EMPTY;
        const shouldRevalidate = !this.clientCache.isFresh(cachedEntry, CACHE_TTL_MS.previewTemplates);

        if (!shouldRevalidate && cachedTemplates) {
          return cached$;
        }

        const network$ = this.previewService.getAllTemplates().pipe(
          tap((templates) => this.clientCache.set(cacheKey, templates)),
          map((templates) => PreviewActions.loadTemplatesSuccess({ templates })),
          catchError(() =>
            cachedTemplates
              ? EMPTY
              : of(
                  PreviewActions.loadTemplatesFailure({
                    errorMessage: 'Không thể tải danh sách template.',
                  }),
                ),
          ),
        );

        return concat(cached$, network$);
      }),
    ),
  );

  searchUsers$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PreviewActions.searchUsers),
      switchMap(({ keyword, page, size }) => {
        const cacheKey = this.clientCache.buildKey(CacheScopes.previewUsers, {
          keyword: keyword ?? '',
          page,
          size,
        });
        const cachedEntry = this.clientCache.get<{ content?: unknown[] } & { users?: unknown[] }>(cacheKey);
        const cachedUsers = (cachedEntry?.value?.content ?? cachedEntry?.value?.users ?? []) as unknown[];
        const cached$ = cachedUsers.length > 0
          ? of(PreviewActions.searchUsersSuccess({ users: cachedUsers as never[] }))
          : EMPTY;
        const shouldRevalidate = !this.clientCache.isFresh(cachedEntry, CACHE_TTL_MS.previewUsers);

        if (!shouldRevalidate && cachedUsers.length > 0) {
          return cached$;
        }

        const network$ = this.previewService.searchUsers(keyword, page, size).pipe(
          tap((response) => this.clientCache.set(cacheKey, response.content || [])),
          map((response) =>
            PreviewActions.searchUsersSuccess({ users: response.content || [] }),
          ),
          catchError(() =>
            cachedUsers.length > 0
              ? EMPTY
              : of(
                  PreviewActions.searchUsersFailure({
                    errorMessage: 'Không thể tải danh sách người dùng.',
                  }),
                ),
          ),
        );

        return concat(cached$, network$);
      }),
    ),
  );
}
