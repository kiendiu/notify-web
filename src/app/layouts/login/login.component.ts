import { Component, DestroyRef, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginController } from './login.controller';
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
  providers: [LoginController, AuthQuery, AuthStateService],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent implements OnInit {
  @ViewChild('googleButtonContainer', { static: false }) googleButtonContainer!: ElementRef;

  private readonly destroyRef = inject(DestroyRef);
  private readonly loginController = inject(LoginController);

  readonly isLoading = this.loginController.isLoading;
  readonly errorMessage = this.loginController.errorMessage;

  ngOnInit(): void {
    this.loginController.init(this.destroyRef);
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
    this.loginController.handleCredentialResponse(response);
  }
}