import { Component, DestroyRef, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../data/services/auth.service';
import { AuthPayload } from '../../managements/dtos/auth-request.dto';
import { AuthQuery } from '../../managements/queries/auth.query';
import { AuthStateService } from '../../managements/states/login.state';
import { SessionKeyService } from '../../core/auth/services/session-key.service';

declare global {
  interface Window {
    google: any;
  }
}
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  providers: [AuthQuery, AuthStateService],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent implements OnInit {
  @ViewChild('googleButtonContainer', { static: false }) googleButtonContainer!: ElementRef;

  constructor(
    private readonly destroyRef: DestroyRef,
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly authQuery: AuthQuery,
    private readonly authState: AuthStateService,
    private readonly sessionKeyService: SessionKeyService,
  ) {}

  readonly isLoading = () => this.authState.getState().isLoading;
  readonly errorMessage = () => this.authState.getState().errorMessage;

  ngOnInit(): void {
    this.authState.state$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((state) => {
      if (state.isAuthenticated) {
        this.router.navigate(['/dashboard']);
      }
    });

    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }

    this.initializeGoogleSignIn();
  }

  private initializeGoogleSignIn(): void {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google && this.googleButtonContainer) {
        const containerWidth = this.googleButtonContainer.nativeElement.parentElement?.offsetWidth ?? 360;

        window.google.accounts.id.initialize({
          client_id: '548079551425-ut5j2hc2ds79nr7eresrldg7i9l869nb.apps.googleusercontent.com',
          callback: this.handleCredentialResponse.bind(this)
        });

        window.google.accounts.id.renderButton(
          this.googleButtonContainer.nativeElement,
          {
            type: 'standard',
            size: 'large',
            width: containerWidth,
            theme: 'outline',
            text: 'signin_with',
            shape: 'rectangular',
            logo_alignment: 'left'
          }
        );
      }
    };
    document.head.appendChild(script);
  }

  private handleCredentialResponse(response: any): void {
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