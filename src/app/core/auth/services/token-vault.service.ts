import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
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
	private readonly encryptionKeyStorageKey = 'knw_auth_key';
	private readonly tokenTypeStorageKey = 'knw_auth_type';
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
			this.ensureSessionKey().then((sessionKey) => this.cryptoService.encrypt(token, sessionKey)).then((encryptedToken) => {
				this.setCookie(this.encryptedRefreshStorageKey, encryptedToken, 30);
			});
			return;
		}

		this.deleteCookie(this.encryptedRefreshStorageKey);
	}

	setTokens(accessToken: string | null, refreshToken: string | null, tokenType?: string | null): void {
		this.setAccessToken(accessToken);
		this.setRefreshToken(refreshToken);
		if (tokenType) {
			this.setCookie(this.tokenTypeStorageKey, tokenType, 30);
		} else {
			this.deleteCookie(this.tokenTypeStorageKey);
		}
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
		const encryptedToken = this.getCookie(this.encryptedTokenStorageKey);
		const encryptedRefresh = this.getCookie(this.encryptedRefreshStorageKey);
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
			}).catch(() => {
				this.deleteCookie(this.encryptedTokenStorageKey);
			}));
		}

		if (encryptedRefresh) {
			promises.push(this.cryptoService.decrypt(encryptedRefresh, sessionKey).then((token) => {
				this.refreshToken = token;
			}).catch(() => {
				this.deleteCookie(this.encryptedRefreshStorageKey);
			}));
		}

		return Promise.all(promises).then(() => this.accessToken);
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
		this.deleteCookie(this.tokenTypeStorageKey);
		this.deleteCookie(this.encryptionKeyStorageKey);
	}

	private getSessionKey(): string | null {
		return this.getCookie(this.encryptionKeyStorageKey);
	}

	private ensureSessionKey(): Promise<string> {
		const existingKey = this.getSessionKey();
		if (existingKey) {
			return Promise.resolve(existingKey);
		}

		return this.cryptoService.createAesKey().then((sessionKey) => {
			this.setCookie(this.encryptionKeyStorageKey, sessionKey, 30);
			return sessionKey;
		});
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