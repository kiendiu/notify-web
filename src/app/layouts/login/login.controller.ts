import { DestroyRef, Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../data/services/auth.service';
import { AuthPayload } from '../../managements/models/auth.model';
import { AuthQuery } from '../../managements/queries/auth.query';
import { AuthStateService, AuthState } from '../../managements/states/login.state';
import { SessionKeyService } from '../../core/auth/services/session-key.service';

@Injectable()
export class LoginController {
	private readonly authService = inject(AuthService);
	private readonly router = inject(Router);
	private readonly authQuery = inject(AuthQuery);
	private readonly authState = inject(AuthStateService);
	private readonly sessionKeyService = inject(SessionKeyService);
	readonly isLoading = () => this.authState.getState().isLoading;
	readonly errorMessage = () => this.authState.getState().errorMessage;

	init(destroyRef: DestroyRef): void {
		this.authState.state$.pipe(takeUntilDestroyed(destroyRef)).subscribe((state: AuthState) => {
			if (state.isAuthenticated) {
				this.router.navigate(['/dashboard']);
			}
		});

		if (this.authService.isAuthenticated()) {
			this.router.navigate(['/dashboard']);
		}
	}

	handleCredentialResponse(response: { credential?: string } | null | undefined): void {
		const payload: AuthPayload = {
			idToken: response?.credential ?? '',
			fcmToken: `fcm_token_${Date.now()}`,
			deviceId: this.getDeviceId(),
			deviceType: 'WEB',
			deviceName: navigator.userAgent.includes('Chrome') ? 'Chrome' : 'Browser',
			osVersion: navigator.platform,
		};

		this.authQuery.login(payload);
	}

	private getDeviceId(): string {
		return this.sessionKeyService.getOrCreate();
	}
}