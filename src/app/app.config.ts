import { ApplicationConfig, provideBrowserGlobalErrorListeners, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HTTP_INTERCEPTORS } from '@angular/common/http';

import { routes } from './routes/app.routes';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { AuthInterceptor } from './core/network/auth.interceptor';
import { authReducer } from './management/stores/auth/auth.reducer';
import { AuthEffects } from './management/stores/auth/auth.effects';
import { campaignReducer } from './management/stores/campaign/campaign.reducer';
import { CampaignEffects } from './management/stores/campaign/campaign.effects';
import { previewReducer } from './management/stores/preview/preview.reducer';
import { PreviewEffects } from './management/stores/preview/preview.effects';


export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    provideStore({ auth: authReducer, campaigns: campaignReducer, preview: previewReducer }),
    provideEffects([AuthEffects, CampaignEffects, PreviewEffects]),
    provideStoreDevtools({ maxAge: 25, logOnly: !isDevMode() }),
  ],
};
