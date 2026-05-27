import { Injectable, OnDestroy, inject } from '@angular/core';
import { map } from 'rxjs';
import { StateService } from '../../core/stores/state/state.service';

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

@Injectable()
export class AuthStateService implements OnDestroy {
	private readonly stateKey = 'kien-notify-web:state:auth';
	private readonly stateService = inject(StateService);
	readonly state$ = this.stateService.watch<AuthState>(this.stateKey).pipe(map((state) => state ?? initialAuthState));

	constructor() {
		if (!this.stateService.get<AuthState>(this.stateKey)) {
			this.stateService.set(this.stateKey, initialAuthState);
		}
	}

	getState(): AuthState {
		return this.stateService.get<AuthState>(this.stateKey) ?? initialAuthState;
	}

	setLoading(isLoading: boolean): void { this.patch({ isLoading }); }
	setErrorMessage(errorMessage: string | null): void { this.patch({ errorMessage }); }
	setAuthenticated(isAuthenticated: boolean): void { this.patch({ isAuthenticated }); }
	setUser(user: unknown | null): void { this.patch({ user }); }
	reset(): void {
		this.stateService.set(this.stateKey, initialAuthState);
	}

	ngOnDestroy(): void {
		this.stateService.remove(this.stateKey);
	}

	private patch(partial: Partial<AuthState>): void {
		this.stateService.update<AuthState>(this.stateKey, (current) => ({
			...initialAuthState,
			...(current ?? initialAuthState),
			...partial,
		}));
	}
}