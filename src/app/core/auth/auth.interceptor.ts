import { Injectable } from '@angular/core';
import {
	HttpErrorResponse,
	HttpEvent,
	HttpHandler,
	HttpInterceptor,
	HttpRequest,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, finalize, map, shareReplay, switchMap, tap } from 'rxjs/operators';
import { TokenVaultService } from './services/token-vault.service';
import { AuthService } from '../../data/services/auth.service';
import { ApiConstant } from '../constants/api.constant';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
	private refreshInFlight$: Observable<string> | null = null;

	constructor(
		private tokenVault: TokenVaultService,
		private authService: AuthService,
	) {}

	intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
		if (this.isAuthEndpoint(request.url)) {
			return next.handle(request);
		}

		const accessToken = this.tokenVault.getAccessToken();
		if (accessToken) {
			request = request.clone({
				setHeaders: {
					Authorization: `Bearer ${accessToken}`,
				},
			});
		}

		return next.handle(request).pipe(
			catchError((error: HttpErrorResponse) => {
				if (this.shouldRefresh(error.status)) {
					return this.getRefreshAccessToken().pipe(
						switchMap((token) => next.handle(this.addToken(request, token))),
						catchError((err) => {
							this.authService.logout();
							return throwError(() => err);
						}),
					);
				}

				return throwError(() => error);
			}),
		);
	}

	private getRefreshAccessToken(): Observable<string> {
		if (!this.refreshInFlight$) {
			this.refreshInFlight$ = this.authService.refreshAccessToken().pipe(
				map((response) => response.accessToken),
				tap((token) => this.tokenVault.setAccessToken(token)),
				finalize(() => {
					this.refreshInFlight$ = null;
				}),
				shareReplay({ bufferSize: 1, refCount: false }),
			);
		}

		return this.refreshInFlight$;
	}

	private addToken(request: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
		return request.clone({
			setHeaders: {
				Authorization: `Bearer ${token}`,
			},
		});
	}

	private shouldRefresh(status: number): boolean {
		return status === 401 || status === 403;
	}

	private isAuthEndpoint(url: string): boolean {
		return url.includes(ApiConstant.AUTH.GOOGLE_LOGIN) || url.includes(ApiConstant.AUTH.REFRESH_TOKEN) || url.includes(ApiConstant.AUTH.LOGOUT);
	}
}