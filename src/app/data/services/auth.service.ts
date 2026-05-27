import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, tap, throwError } from 'rxjs';
import { ApiConstant } from '../../core/constants/api.constant';
import { TokenStorageService } from '../../core/auth/services/token-storage.service';
import { AuthPayload, AuthResponse, AuthState } from '../../managements/models/auth.model';
import { API_ENGINE } from '../../core/stores/api/api.engine.interface';

@Injectable({
	providedIn: 'root',
})
export class AuthService {
	private readonly apiEngine = inject(API_ENGINE);
	private readonly tokenStorage = inject(TokenStorageService);
	private readonly STORAGE_KEY = 'auth_state';

	private authState$ = new BehaviorSubject<AuthState>(this.loadAuthState());

	login(payload: AuthPayload): Observable<AuthResponse> {
		return this.apiEngine.post<AuthResponse>(ApiConstant.AUTH.GOOGLE_LOGIN, payload).pipe(
			tap((response) => {
				const state: AuthState = {
					accessToken: response.accessToken,
					refreshToken: response.refreshToken,
					tokenType: response.tokenType,
					isAuthenticated: true,
				};

				this.tokenStorage.setTokens({
					accessToken: response.accessToken,
					refreshToken: response.refreshToken,
					tokenType: response.tokenType,
					deviceId: payload.deviceId,
				});

				this.saveAuthState(state);
				this.authState$.next(state);
			}),
		);
	}

	logout(): void {
		localStorage.removeItem(this.STORAGE_KEY);
		this.tokenStorage.clearTokens();

		this.authState$.next({
			accessToken: null,
			refreshToken: null,
			tokenType: null,
			isAuthenticated: false,
		});
	}

	getAuthState(): Observable<AuthState> {
		return this.authState$.asObservable();
	}

	isAuthenticated(): boolean {
		return this.authState$.value.isAuthenticated;
	}

	getAccessToken(): string | null {
		return this.authState$.value.accessToken;
	}

	getRefreshToken(): string | null {
		return this.authState$.value.refreshToken;
	}

	getTokenType(): string | null {
		return this.authState$.value.tokenType;
	}

	refreshToken(): Observable<AuthResponse> {
		const refreshToken = this.tokenStorage.getRefreshToken();
		const deviceId = this.tokenStorage.getDeviceId();

		if (!refreshToken || !deviceId) {
			return throwError(() => new Error('No refresh token or device ID available'));
		}

		return this.apiEngine.post<AuthResponse>(ApiConstant.AUTH.REFRESH_TOKEN, {
			refreshToken,
			deviceId,
		}).pipe(
			tap((response) => {
				this.tokenStorage.setTokens({
					accessToken: response.accessToken,
					refreshToken: response.refreshToken,
					tokenType: response.tokenType,
					deviceId,
				});

				const state: AuthState = {
					accessToken: response.accessToken,
					refreshToken: response.refreshToken,
					tokenType: response.tokenType,
					isAuthenticated: true,
				};

				this.saveAuthState(state);
				this.authState$.next(state);
			}),
		);
	}

	private saveAuthState(state: AuthState): void {
		localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
	}

	private loadAuthState(): AuthState {
		const stored = localStorage.getItem(this.STORAGE_KEY);

		if (stored) {
			return JSON.parse(stored) as AuthState;
		}

		return {
			accessToken: null,
			refreshToken: null,
			tokenType: null,
			isAuthenticated: false,
		};
	}
}
