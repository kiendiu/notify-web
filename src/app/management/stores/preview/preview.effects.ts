import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import * as PreviewActions from './preview.actions';
import { PreviewService } from '../../../services/preview.service';

@Injectable()
export class PreviewEffects {
  private readonly actions$ = inject(Actions);
  private readonly previewService = inject(PreviewService);

  loadTemplates$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PreviewActions.loadTemplates),
      switchMap(() =>
        this.previewService.getAllTemplates().pipe(
          map((templates) => PreviewActions.loadTemplatesSuccess({ templates })),
          catchError(() =>
            of(
              PreviewActions.loadTemplatesFailure({
                errorMessage: 'Không thể tải danh sách template.',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  searchUsers$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PreviewActions.searchUsers),
      switchMap(({ keyword, page, size }) =>
        this.previewService.searchUsers(keyword, page, size).pipe(
          map((response) =>
            PreviewActions.searchUsersSuccess({ users: response.content || [] }),
          ),
          catchError(() =>
            of(
              PreviewActions.searchUsersFailure({
                errorMessage: 'Không thể tải danh sách người dùng.',
              }),
            ),
          ),
        ),
      ),
    ),
  );
}
