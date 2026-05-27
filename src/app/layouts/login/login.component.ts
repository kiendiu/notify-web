import { Component, ElementRef, OnInit, ViewChild, effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../data/services/auth.service';
import { AuthPayload } from '../../managements/models/auth.model';
import { AuthQuery } from '../../managements/queries/auth.query';
import { AuthStateService } from '../../managements/states/login.state';

declare global {
  interface Window {
    google: any;
  }
}
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent implements OnInit {
  @ViewChild('googleButtonContainer', { static: false }) googleButtonContainer!: ElementRef;

  private readonly DEVICE_ID_STORAGE_KEY = 'web_device_id';
  private readonly authState = inject(AuthStateService);

  readonly isLoading = this.authState.isLoading;
  readonly errorMessage = this.authState.errorMessage;

  constructor(
    private authService: AuthService,
    private router: Router,
    private readonly authQuery: AuthQuery
  ) {
    this.initializeDeviceId();

    effect(() => {
      if (this.authState.isAuthenticated()) {
        this.router.navigate(['/dashboard']);
      }
    });
  }

  private initializeDeviceId(): void {
    let deviceId = localStorage.getItem(  this.DEVICE_ID_STORAGE_KEY );
    if (!deviceId) {
      deviceId = 'WEB_DEVICE_' + Date.now();
      localStorage.setItem(
        this.DEVICE_ID_STORAGE_KEY,
        deviceId,
      );
    }
  }

  private getDeviceId(): string {
    const deviceId = localStorage.getItem( this.DEVICE_ID_STORAGE_KEY );
    if (!deviceId) {
      const newDeviceId = 'WEB_DEVICE_' + Date.now();
      localStorage.setItem(
        this.DEVICE_ID_STORAGE_KEY,
        newDeviceId,
      );
      return newDeviceId;
    }
    return deviceId;
  }

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
      return;
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
      idToken: response.credential,
      fcmToken: 'fcm_token_' + Date.now(),
      deviceId: this.getDeviceId(),
      deviceType: 'WEB',
      deviceName: navigator.userAgent.includes('Chrome') ? 'Chrome' : 'Browser',
      osVersion: navigator.platform
    };
    this.authQuery.login(payload);
  }
}