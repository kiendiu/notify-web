import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CryptoService {
	async sha256(value: string): Promise<string> {
		const encoded = new TextEncoder().encode(value);
		const digest = await crypto.subtle.digest('SHA-256', encoded);
		return Array.from(new Uint8Array(digest))
			.map((byte) => byte.toString(16).padStart(2, '0'))
			.join('');
	}

	async createAesKey(): Promise<string> {
		const keyBytes = crypto.getRandomValues(new Uint8Array(32));
		return this.toBase64(keyBytes);
	}

	async encrypt(value: string, keyBase64: string): Promise<string> {
		const iv = crypto.getRandomValues(new Uint8Array(12));
		const key = await this.importAesKey(keyBase64);
		const encoded = new TextEncoder().encode(value);
		const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
		return `${this.toBase64(iv)}.${this.toBase64(new Uint8Array(encrypted))}`;
	}

	async decrypt(payload: string, keyBase64: string): Promise<string> {
		const [ivBase64, encryptedBase64] = payload.split('.');
		if (!ivBase64 || !encryptedBase64) {
			throw new Error('Invalid encrypted payload.');
		}

		const key = await this.importAesKey(keyBase64);
		const iv = this.fromBase64(ivBase64);
		const encrypted = this.fromBase64(encryptedBase64);
		const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encrypted);
		return new TextDecoder().decode(decrypted);
	}

	private async importAesKey(keyBase64: string): Promise<CryptoKey> {
		return crypto.subtle.importKey(
			'raw',
			this.fromBase64(keyBase64),
			'AES-GCM',
			false,
			['encrypt', 'decrypt'],
		);
	}

	private toBase64(bytes: Uint8Array): string {
		let binary = '';
		for (const byte of bytes) {
			binary += String.fromCharCode(byte);
		}
		return btoa(binary);
	}

	private fromBase64(value: string): ArrayBuffer {
		const binary = atob(value);
		const bytes = new Uint8Array(binary.length);
		for (let index = 0; index < binary.length; index += 1) {
			bytes[index] = binary.charCodeAt(index);
		}
		return bytes.buffer;
	}
}