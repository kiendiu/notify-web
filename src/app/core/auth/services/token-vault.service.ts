import { Injectable, inject } from '@angular/core';
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
	private readonly encryptedTokenStorageKey = 'kien-notify-web:auth:encrypted-access-token';
	private readonly encryptionKeyStorageKey = 'kien-notify-web:auth:crypto-key';
	private readonly cryptoService = inject(CryptoService);
	private accessToken: string | null = null;
	private readonly accessTokenChangesSubject = new BehaviorSubject<string | null>(null);
	private readonly pendingRequests = new Map<string, (token: string | null) => void>();
	private readonly channel: BroadcastChannel | null = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel(this.channelName);

	readonly accessTokenChanges$: Observable<string | null> = this.accessTokenChangesSubject.asObservable();

	constructor() {
		this.channel?.addEventListener('message', (event: MessageEvent<TokenVaultMessage>) => {
			this.handleMessage(event.data);
		});
	}

	setAccessToken(token: string | null): void {
		this.accessToken = token;
		this.accessTokenChangesSubject.next(token);

		if (token) {
			void this.persistAccessToken(token);
			this.channel?.postMessage({ type: 'token-updated', accessToken: token });
			return;
		}

		this.clearPersistedToken();
	}

	getAccessToken(): string | null {
		return this.accessToken;
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
		const encryptedToken = localStorage.getItem(this.encryptedTokenStorageKey);
		if (!encryptedToken) {
			return Promise.resolve(null);
		}

		const sessionKey = this.getSessionKey();
		if (!sessionKey) {
			return Promise.resolve(null);
		}

		return this.cryptoService.decrypt(encryptedToken, sessionKey).then((token) => {
			this.setAccessToken(token);
			return token;
		}).catch(() => {
			this.clearPersistedToken();
			return null;
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
			localStorage.setItem(this.encryptedTokenStorageKey, encryptedToken);
		});
	}

	private clearPersistedToken(): void {
		localStorage.removeItem(this.encryptedTokenStorageKey);
		localStorage.removeItem(this.encryptionKeyStorageKey);
	}

	private getSessionKey(): string | null {
		return localStorage.getItem(this.encryptionKeyStorageKey);
	}

	private ensureSessionKey(): Promise<string> {
		const existingKey = this.getSessionKey();
		if (existingKey) {
			return Promise.resolve(existingKey);
		}

		return this.cryptoService.createAesKey().then((sessionKey) => {
			localStorage.setItem(this.encryptionKeyStorageKey, sessionKey);
			return sessionKey;
		});
	}
}