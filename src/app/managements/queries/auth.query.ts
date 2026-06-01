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

	async login(payload: AuthPayload): Promise<void> {
		try {
			this.authState.setLoading(true);
			this.authState.setErrorMessage(null);

			await this.authService.login(payload);

			this.authState.setAuthenticated(true);
		} catch (error: unknown) {
			this.authState.setAuthenticated(false);
			this.authState.setErrorMessage(
				error instanceof Error ? error.message : 'Không thể đăng nhập.',
			);
		} finally {
			this.authState.setLoading(false);
		}
	}

	logout(): void {
		this.authService.logout();
		this.authState.reset();
	}
}
