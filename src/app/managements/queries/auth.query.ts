import { Injectable } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../data/services/auth.service';
import { AuthPayload } from '../dtos/auth-request.dto';
import { AuthStateService } from '../states/login.state';

@Injectable()
export class AuthQuery {
	constructor(
		private readonly authService: AuthService,
		private readonly authState: AuthStateService,
	) {}

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
