import { Injectable } from '@angular/core';

export interface TokenData {
	accessToken: string;
	refreshToken: string;
	tokenType: string;
	deviceId?: string;
}

@Injectable({
	providedIn: 'root',
})
export class TokenStorageService {
	private readonly ACCESS_TOKEN_KEY = 'access_token';
	private readonly REFRESH_TOKEN_KEY = 'refresh_token';
	private readonly TOKEN_TYPE_KEY = 'token_type';
	private readonly DEVICE_ID_KEY = 'device_id';

	setTokens(data: TokenData): void {
		localStorage.setItem(this.ACCESS_TOKEN_KEY, data.accessToken);
		localStorage.setItem(this.REFRESH_TOKEN_KEY, data.refreshToken);
		localStorage.setItem(this.TOKEN_TYPE_KEY, data.tokenType);
		if (data.deviceId) {
			localStorage.setItem(this.DEVICE_ID_KEY, data.deviceId);
		}
	}

	getAccessToken(): string | null {
		return localStorage.getItem(this.ACCESS_TOKEN_KEY);
	}

	getRefreshToken(): string | null {
		return localStorage.getItem(this.REFRESH_TOKEN_KEY);
	}

	getTokenType(): string | null {
		return localStorage.getItem(this.TOKEN_TYPE_KEY);
	}

	getDeviceId(): string | null {
		return localStorage.getItem(this.DEVICE_ID_KEY);
	}

	setDeviceId(deviceId: string): void {
		localStorage.setItem(this.DEVICE_ID_KEY, deviceId);
	}

	clearTokens(): void {
		localStorage.removeItem(this.ACCESS_TOKEN_KEY);
		localStorage.removeItem(this.REFRESH_TOKEN_KEY);
		localStorage.removeItem(this.TOKEN_TYPE_KEY);
		localStorage.removeItem(this.DEVICE_ID_KEY);
	}

	hasAccessToken(): boolean {
		return !!this.getAccessToken();
	}
}