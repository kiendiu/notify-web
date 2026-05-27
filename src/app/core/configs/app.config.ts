import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { provideStore } from '@ngrx/store';

import { routes } from '../../routes/app.routes';
import { AuthInterceptor } from '../auth/auth.interceptor';
import { engineStateReducer } from '../stores/state/state.reducer';
import { provideApiEngine } from '../stores/api/api.engine.interface';
import { HttpApiEngine } from '../stores/api/http-api.engine';
import { provideCacheEngine } from '../stores/cache/cache.engine';
import { MemoryCacheEngine } from '../stores/cache/memory-cache.engine';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    provideApiEngine(HttpApiEngine),
    provideCacheEngine(MemoryCacheEngine),
    provideStore({ engineState: engineStateReducer }),
  ],
};