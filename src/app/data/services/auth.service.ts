import { Inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, firstValueFrom, map, of, tap } from 'rxjs';
import { Endpoint } from '../../core/constants/endpoint';
import { TokenVaultService } from '../../core/auth/services/token-vault.service';
import { AuthPayload } from '../../managements/dtos/auth-request.dto';
import { AuthResponse } from '../../managements/dtos/auth-response.dto';
import { API_ENGINE, ApiEngine } from '../../core/stores/api/api.engine.interface';

@Injectable({ providedIn: 'root' })
export class AuthService {
	constructor(
		@Inject(API_ENGINE) private readonly apiEngine: ApiEngine,
		private readonly tokenVault: TokenVaultService,
	) {
		this.tokenVault.accessTokenChanges$.subscribe((token) => {
			this.currentAccessToken = token;
			this.authState$.next(Boolean(token));
		});
	}
	private readonly authState$ = new BehaviorSubject(false);
	private currentAccessToken: string | null = null;

	async login(payload: AuthPayload): Promise<AuthResponse> {
		const response = await firstValueFrom(
			this.apiEngine.post<AuthResponse>(
			Endpoint.AUTH.GOOGLE_LOGIN,
			payload,
			{ withCredentials: true }
			)
		);

		this.setSession(
			response.accessToken,
			response.refreshToken ?? null,
		);

		return response;
	}

	async logout(): Promise<void> {
		this.clearSession();
		await firstValueFrom(
			this.apiEngine.post<void>(Endpoint.AUTH.LOGOUT, {}, { withCredentials: true }).pipe(
				catchError(() => of(void 0)),
			),
		);
	}

	isAuthenticated(): boolean {
		return this.authState$.value;
	}

	getAccessToken(): string | null {
		return this.currentAccessToken;
	}

	refreshAccessToken(): Observable<AuthResponse> {
		return this.apiEngine.post<AuthResponse>(Endpoint.AUTH.REFRESH_TOKEN, {}, { withCredentials: true }).pipe(
			tap((response) => this.setSession(response.accessToken, response.refreshToken ?? null)),
		);
	}

	async bootstrapSession(): Promise<void> {
		const sharedToken = await this.tokenVault.requestAccessToken();
		if (sharedToken) {
			this.tokenVault.setAccessToken(sharedToken);
			return;
		}

		const persistedToken = await this.tokenVault.restorePersistedAccessToken();
		if (persistedToken) {
			return;
		}

		await firstValueFrom(
			this.refreshAccessToken().pipe(
				map(() => void 0),
				catchError(() => {
					this.clearSession();
					return of(void 0);
				}),
			),
		);
	}

	private setSession(accessToken: string, refreshToken: string | null): void {
		this.currentAccessToken = accessToken;
		this.tokenVault.setTokens(accessToken, refreshToken);
		this.clearLegacyAuthStorage();
	}

	private clearSession(): void {
		this.currentAccessToken = null;
		this.tokenVault.clear();
		this.clearLegacyAuthStorage();
	}

	private clearLegacyAuthStorage(): void {
		const legacyKeys = ['auth_state', 'access_token', 'refresh_token', 'token_type'];
		for (const key of legacyKeys) {
			localStorage.removeItem(key);
		}
	}
}