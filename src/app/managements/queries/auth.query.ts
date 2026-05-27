import { Injectable, inject } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../data/services/auth.service';
import { AuthPayload } from '../models/auth.model';
import { AuthStateService } from '../states/login.state';

@Injectable()
export class AuthQuery {
	private readonly authService = inject(AuthService);
	private readonly authState = inject(AuthStateService);

	login(payload: AuthPayload): void {
		this.authState.setLoading(true);
		this.authState.setErrorMessage(null);

		this.authService.login(payload).pipe(
			finalize(() => this.authState.setLoading(false)),
		).subscribe({
			next: () => {
				this.authState.setAuthenticated(true);
			},
			error: (error: unknown) => {
				this.authState.setAuthenticated(false);
				this.authState.setErrorMessage(error instanceof Error ? error.message : 'Không thể đăng nhập.');
			},
		});
	}

	logout(): void {
		this.authService.logout();
		this.authState.reset();
	}
}
