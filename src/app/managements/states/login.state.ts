import { Injectable, computed, signal } from '@angular/core';

export interface AuthState {
	isLoading: boolean;
	errorMessage: string | null;
	isAuthenticated: boolean;
	user: unknown | null;
}

export const initialAuthState: AuthState = {
	isLoading: false,
	errorMessage: null,
	isAuthenticated: false,
	user: null,
};

@Injectable({ providedIn: 'root' })
export class AuthStateService {
	readonly isLoading = signal(false);
	readonly errorMessage = signal<string | null>(null);
	readonly isAuthenticated = signal(false);
	readonly user = signal<unknown | null>(null);
	readonly state = computed<AuthState>(() => ({
		isLoading: this.isLoading(),
		errorMessage: this.errorMessage(),
		isAuthenticated: this.isAuthenticated(),
		user: this.user(),
	}));

	setLoading(isLoading: boolean): void { this.isLoading.set(isLoading); }
	setErrorMessage(errorMessage: string | null): void { this.errorMessage.set(errorMessage); }
	setAuthenticated(isAuthenticated: boolean): void { this.isAuthenticated.set(isAuthenticated); }
	setUser(user: unknown | null): void { this.user.set(user); }
	reset(): void {
		this.isLoading.set(false);
		this.errorMessage.set(null);
		this.isAuthenticated.set(false);
		this.user.set(null);
	}
}