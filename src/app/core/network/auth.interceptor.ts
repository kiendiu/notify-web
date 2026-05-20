import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { TokenStorageService } from '../services/token-storage.service';
import { AuthService } from '../../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject =
    new BehaviorSubject<string | null>(null);

  constructor(
    private tokenStorage: TokenStorageService,
    private authService: AuthService,
  ) {}

  intercept( request: HttpRequest<unknown>, next: HttpHandler ): Observable<HttpEvent<unknown>> {
    const accessToken =
      this.tokenStorage.getAccessToken();

    if (accessToken) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if ( error.status === 401 && !this.isRefreshing ) {
          this.isRefreshing = true;
          this.refreshTokenSubject.next(null);

          return this.authService
            .refreshToken()
            .pipe( switchMap((response) => {
                this.isRefreshing = false;
                this.refreshTokenSubject.next(
                  response.accessToken,
                );

                return next.handle(
                  this.addToken(
                    request,
                    response.accessToken,
                  ),
                );
              }),
              catchError((err) => {
                this.isRefreshing = false;
                this.authService.logout();
                return throwError(
                  () => err,
                );
              }),
            );
        } else if (
          error.status === 401 &&
          this.isRefreshing
        ) {
          return this.refreshTokenSubject
            .pipe( filter((token) => token !== null), take(1),
              switchMap((token) => {
                return next.handle(
                  this.addToken(
                    request,
                    token!,
                  ),
                );
              }),
            );
        }

        return throwError(
          () => error,
        );
      }),
    );
  }

  private addToken(
    request: HttpRequest<unknown>,
    token: string,
  ): HttpRequest<unknown> {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }
}