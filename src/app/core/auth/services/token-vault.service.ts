import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthKeyService } from './auth-key.service';
import { CryptoService } from './crypto.service';

type TokenVaultMessage =
	| { type: 'request-token'; requestId: string }
	| { type: 'response-token'; requestId: string; accessToken: string }
	| { type: 'token-updated'; accessToken: string }
	| { type: 'logout' };

@Injectable({ providedIn: 'root' })
export class TokenVaultService {
	private readonly channelName = 'kien-notify-web:auth';
	private readonly encryptedTokenStorageKey = 'knw_auth_access';
	private readonly encryptedRefreshStorageKey = 'knw_auth_refresh';
	private readonly tokenTypeStorageKey = 'knw_auth_type';
	private readonly legacyEncryptedTokenStorageKey = 'kien-notify-web:auth:encrypted-access-token';
	private readonly legacyEncryptedRefreshStorageKey = 'kien-notify-web:auth:encrypted-refresh-token';
	private readonly legacyTokenTypeStorageKey = 'kien-notify-web:auth:token-type';
	private readonly authKeyService = inject(AuthKeyService);

	constructor(private readonly cryptoService: CryptoService) {
		this.channel?.addEventListener('message', (event: MessageEvent<TokenVaultMessage>) => {
			this.handleMessage(event.data);
		});
	}
	private accessToken: string | null = null;
	private refreshToken: string | null = null;
	private readonly accessTokenChangesSubject = new BehaviorSubject<string | null>(null);
	private readonly pendingRequests = new Map<string, (token: string | null) => void>();
	private readonly channel: BroadcastChannel | null = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel(this.channelName);

	readonly accessTokenChanges$: Observable<string | null> = this.accessTokenChangesSubject.asObservable();

	setAccessToken(token: string | null): void {
		this.accessToken = token;
		this.accessTokenChangesSubject.next(token);

		if (token) {
			this.deleteCookie(this.legacyEncryptedTokenStorageKey);
			this.ensureSessionKey().then((sessionKey) => this.cryptoService.encrypt(token, sessionKey)).then((encryptedToken) => {
				this.setCookie(this.encryptedTokenStorageKey, encryptedToken, 7);
			});
			this.channel?.postMessage({ type: 'token-updated', accessToken: token });
			return;
		}

		this.clearPersistedToken();
	}

	setRefreshToken(token: string | null): void {
		this.refreshToken = token;
		if (token) {
			this.deleteCookie(this.legacyEncryptedRefreshStorageKey);
			this.ensureSessionKey().then((sessionKey) => this.cryptoService.encrypt(token, sessionKey)).then((encryptedToken) => {
				this.setCookie(this.encryptedRefreshStorageKey, encryptedToken, 30);
			});
			return;
		}

		this.deleteCookie(this.encryptedRefreshStorageKey);
	}

	setTokens(accessToken: string | null, refreshToken: string | null): void {
		this.setAccessToken(accessToken);
		this.setRefreshToken(refreshToken);
		this.clearTokenTypeCookies();
	}

	getAccessToken(): string | null {
		return this.accessToken;
	}

	getRefreshToken(): string | null {
		return this.refreshToken;
	}

	requestAccessToken(timeoutMs = 250): Promise<string | null> {
		if (this.accessToken) {
			return Promise.resolve(this.accessToken);
		}

		if (!this.channel) {
			return Promise.resolve(null);
		}

		const requestId = this.createRequestId();

		return new Promise((resolve) => {
			const timeoutHandle = window.setTimeout(() => {
				this.pendingRequests.delete(requestId);
				resolve(null);
			}, timeoutMs);

			this.pendingRequests.set(requestId, (token) => {
				window.clearTimeout(timeoutHandle);
				resolve(token);
			});

			this.channel?.postMessage({ type: 'request-token', requestId });
		});
	}

	clear(): void {
		this.accessToken = null;
		this.accessTokenChangesSubject.next(null);
		this.clearPersistedToken();
		this.channel?.postMessage({ type: 'logout' });
	}

	restorePersistedAccessToken(): Promise<string | null> {
		const encryptedToken = this.getCookie(this.encryptedTokenStorageKey) ?? this.getCookie(this.legacyEncryptedTokenStorageKey);
		const encryptedRefresh = this.getCookie(this.encryptedRefreshStorageKey) ?? this.getCookie(this.legacyEncryptedRefreshStorageKey);
		if (!encryptedToken && !encryptedRefresh) {
			return Promise.resolve(null);
		}

		const sessionKey = this.getSessionKey();
		if (!sessionKey) {
			return Promise.resolve(null);
		}

		const promises: Promise<void>[] = [];

		if (encryptedToken) {
			promises.push(this.cryptoService.decrypt(encryptedToken, sessionKey).then((token) => {
				this.setAccessToken(token);
				this.deleteCookie(this.legacyEncryptedTokenStorageKey);
			}).catch(() => {
				this.deleteCookie(this.encryptedTokenStorageKey);
				this.deleteCookie(this.legacyEncryptedTokenStorageKey);
			}));
		}

		if (encryptedRefresh) {
			promises.push(this.cryptoService.decrypt(encryptedRefresh, sessionKey).then((token) => {
				this.refreshToken = token;
				this.deleteCookie(this.legacyEncryptedRefreshStorageKey);
			}).catch(() => {
				this.deleteCookie(this.encryptedRefreshStorageKey);
				this.deleteCookie(this.legacyEncryptedRefreshStorageKey);
			}));
		}

		return Promise.all(promises).then(() => {
			this.clearTokenTypeCookies();
			return this.accessToken;
		});
	}

	close(): void {
		this.channel?.close();
	}

	private handleMessage(message: TokenVaultMessage): void {
		if (message.type === 'request-token') {
			if (this.accessToken) {
				this.channel?.postMessage({
					type: 'response-token',
					requestId: message.requestId,
					accessToken: this.accessToken,
				});
			}
			return;
		}

		if (message.type === 'response-token') {
			const pending = this.pendingRequests.get(message.requestId);
			if (!pending) {
				return;
			}

			this.pendingRequests.delete(message.requestId);
			this.setAccessToken(message.accessToken);
			pending(message.accessToken);
			return;
		}

		if (message.type === 'token-updated') {
			if (this.accessToken !== message.accessToken) {
				this.accessToken = message.accessToken;
				this.accessTokenChangesSubject.next(message.accessToken);
			}
			return;
		}

		if (message.type === 'logout') {
			this.accessToken = null;
			this.accessTokenChangesSubject.next(null);
		}
	}

	private createRequestId(): string {
		if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
			return crypto.randomUUID();
		}

		return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
	}

	private persistAccessToken(token: string): Promise<void> {
		return this.ensureSessionKey().then((sessionKey) => this.cryptoService.encrypt(token, sessionKey)).then((encryptedToken) => {
			this.setCookie(this.encryptedTokenStorageKey, encryptedToken, 7);
		});
	}

	private clearPersistedToken(): void {
		this.deleteCookie(this.encryptedTokenStorageKey);
		this.deleteCookie(this.encryptedRefreshStorageKey);
		this.deleteCookie(this.legacyEncryptedTokenStorageKey);
		this.deleteCookie(this.legacyEncryptedRefreshStorageKey);
		this.clearTokenTypeCookies();
		this.authKeyService.clearSessionKey();
	}

	private clearTokenTypeCookies(): void {
		this.deleteCookie(this.tokenTypeStorageKey);
		this.deleteCookie(this.legacyTokenTypeStorageKey);
	}

	private ensureSessionKey(): Promise<string> {
		return this.authKeyService.getOrCreateSessionKey();
	}

	private getSessionKey(): string | null {
		return this.authKeyService.getSessionKey();
	}

	// Cookie helpers
	private setCookie(name: string, value: string, days = 7): void {
		const expires = new Date(Date.now() + days * 864e5).toUTCString();
		const secureAttribute = this.shouldUseSecureCookie() ? '; Secure' : '';
		document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; expires=${expires}; path=/;${secureAttribute} SameSite=Lax`;
	}

	private getCookie(name: string): string | null {
		const match = document.cookie.split('; ').find((row) => row.startsWith(`${encodeURIComponent(name)}=`));
		if (!match) return null;
		return decodeURIComponent(match.split('=')[1] || '');
	}

	private deleteCookie(name: string): void {
		const secureAttribute = this.shouldUseSecureCookie() ? '; Secure' : '';
		document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;${secureAttribute} SameSite=Lax`;
	}

	private shouldUseSecureCookie(): boolean {
		if (typeof window === 'undefined') {
			return false;
		}

		return window.location.protocol === 'https:';
	}
}