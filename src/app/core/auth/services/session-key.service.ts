import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SessionKeyService {
	private readonly keyName = 'kien-notify-web:session-key';

	getOrCreate(): string {
		if (typeof window === 'undefined') {
			return crypto.randomUUID();
		}

		const existing = window.sessionStorage.getItem(this.keyName);
		if (existing) {
			return existing;
		}

		const next = crypto.randomUUID();
		window.sessionStorage.setItem(this.keyName, next);
		return next;
	}
}