import { Injectable } from '@angular/core';
import { CryptoService } from './crypto.service';

@Injectable({ providedIn: 'root' })
export class AuthKeyService {
	private readonly encryptionKeyStorageKey = 'knw_auth_key';
	private readonly legacyEncryptionKeyStorageKey = 'kien-notify-web:auth:crypto-key';

	constructor(private readonly cryptoService: CryptoService) {}

	getSessionKey(): string | null {
		const currentKey = this.getCookie(this.encryptionKeyStorageKey);
		if (currentKey) {
			return currentKey;
		}

		const legacyKey = this.getCookie(this.legacyEncryptionKeyStorageKey);
		if (!legacyKey) {
			return null;
		}

		this.setCookie(this.encryptionKeyStorageKey, legacyKey, 30);
		this.deleteCookie(this.legacyEncryptionKeyStorageKey);
		return legacyKey;
	}

	async getOrCreateSessionKey(): Promise<string> {
		const existingKey = this.getSessionKey();
		if (existingKey) {
			return existingKey;
		}

		const sessionKey = await this.cryptoService.createAesKey();
		this.setCookie(this.encryptionKeyStorageKey, sessionKey, 30);
		return sessionKey;
	}

	clearSessionKey(): void {
		this.deleteCookie(this.encryptionKeyStorageKey);
		this.deleteCookie(this.legacyEncryptionKeyStorageKey);
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