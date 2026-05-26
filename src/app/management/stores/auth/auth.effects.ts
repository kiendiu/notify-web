import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import * as AuthActions from './auth.actions';
import { AuthService } from '../../../services/auth.service';

@Injectable()
export class AuthEffects {
  login$;
  loginSuccess$;

  constructor(
    private actions$: Actions,
    private authService: AuthService,
    private router: Router
  ) {
    this.login$ = createEffect(() =>
      this.actions$.pipe(
        ofType(AuthActions.login),
        switchMap(({ payload }) =>
          this.authService.login(payload).pipe(
            map(() => {
              return AuthActions.loginSuccess({ user: payload });
            }),
            catchError((error) => {
              let errorMessage = 'Đăng nhập thất bại. Vui lòng thử lại!';
              if (error.status === 403) {
                errorMessage = 'Bạn không có quyền truy cập. Vui lòng thử lại!';
              }
              return of(AuthActions.loginFailure({ errorMessage }));
            })
          )
        )
      )
    );

    this.loginSuccess$ = createEffect(
      () =>
        this.actions$.pipe(
          ofType(AuthActions.loginSuccess),
          tap(() => {
            this.router.navigate(['/dashboard']);
          })
        ),
      { dispatch: false }
    );
  }
}
