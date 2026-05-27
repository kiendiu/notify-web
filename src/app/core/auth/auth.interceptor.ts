import { Injectable } from '@angular/core';
import {
	HttpErrorResponse,
	HttpEvent,
	HttpHandler,
	HttpInterceptor,
	HttpRequest,
} from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { TokenStorageService } from './services/token-storage.service';
import { AuthService } from '../../data/services/auth.service';
import { ApiConstant } from '../constants/api.constant';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
	private isRefreshing = false;
	private refreshTokenSubject = new BehaviorSubject<string | null>(null);

	constructor(
		private tokenStorage: TokenStorageService,
		private authService: AuthService,
	) {}

	intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
		if (this.isAuthEndpoint(request.url)) {
			return next.handle(request);
		}

		const accessToken = this.tokenStorage.getAccessToken();
		if (accessToken) {
			request = request.clone({
				setHeaders: {
					Authorization: `Bearer ${accessToken}`,
				},
			});
		}

		return next.handle(request).pipe(
			catchError((error: HttpErrorResponse) => {
				if (this.shouldRefresh(error.status) && !this.isRefreshing) {
					this.isRefreshing = true;
					this.refreshTokenSubject.next(null);

					return this.authService.refreshToken().pipe(
						switchMap((response) => {
							this.isRefreshing = false;
							this.refreshTokenSubject.next(response.accessToken);
							return next.handle(this.addToken(request, response.accessToken));
						}),
						catchError((err) => {
							this.isRefreshing = false;
							this.authService.logout();
							return throwError(() => err);
						}),
					);
				}

				if (this.shouldRefresh(error.status) && this.isRefreshing) {
					return this.refreshTokenSubject.pipe(
						filter((token) => token !== null),
						take(1),
						switchMap((token) => next.handle(this.addToken(request, token!))),
					);
				}

				return throwError(() => error);
			}),
		);
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
		return url.includes(ApiConstant.AUTH.GOOGLE_LOGIN) || url.includes(ApiConstant.AUTH.REFRESH_TOKEN);
	}
}