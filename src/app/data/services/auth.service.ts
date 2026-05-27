import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, catchError, firstValueFrom, map, of, tap } from 'rxjs';
import { ApiConstant } from '../../core/constants/api.constant';
import { TokenVaultService } from '../../core/auth/services/token-vault.service';
import { AuthPayload, AuthResponse } from '../../managements/models/auth.model';
import { API_ENGINE } from '../../core/stores/api/api.engine.interface';

@Injectable({
	providedIn: 'root',
})
export class AuthService {
	private readonly apiEngine = inject(API_ENGINE);
	private readonly tokenVault = inject(TokenVaultService);

	private readonly authState$ = new BehaviorSubject(false);

	constructor() {
		this.tokenVault.accessTokenChanges$.subscribe((token) => {
			this.authState$.next(Boolean(token));
		});
	}

	login(payload: AuthPayload): Observable<AuthResponse> {
		return this.apiEngine.post<AuthResponse>(ApiConstant.AUTH.GOOGLE_LOGIN, payload, { withCredentials: true }).pipe(
			tap((response) => {
				this.setSession(response.accessToken);
			}),
		);
	}

	logout(): void {
		this.clearSession();
		this.apiEngine.post<void>(ApiConstant.AUTH.LOGOUT, {}, { withCredentials: true }).pipe(
			catchError(() => of(void 0)),
		).subscribe();
	}

	isAuthenticated(): boolean {
		return this.authState$.value;
	}

	getAccessToken(): string | null {
		return this.tokenVault.getAccessToken();
	}

	refreshAccessToken(): Observable<AuthResponse> {
		return this.apiEngine.post<AuthResponse>(ApiConstant.AUTH.REFRESH_TOKEN, {}, { withCredentials: true }).pipe(
			tap((response) => this.setSession(response.accessToken)),
		);
	}

	bootstrapSession(): Promise<void> {
		return this.tokenVault.requestAccessToken().then((sharedToken) => {
			if (sharedToken) {
				this.setSession(sharedToken);
				return;
			}

			return this.tokenVault.restorePersistedAccessToken().then((persistedToken) => {
				if (persistedToken) {
					this.setSession(persistedToken);
					return;
				}

				return firstValueFrom(
					this.refreshAccessToken().pipe(
						map(() => void 0),
						catchError(() => {
							this.clearSession();
							return of(void 0);
						}),
					),
				);
			});
		});
	}

	private setSession(accessToken: string): void {
		this.tokenVault.setAccessToken(accessToken);
		this.clearLegacyAuthStorage();
	}

	private clearSession(): void {
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
