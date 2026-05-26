import { createReducer, on } from '@ngrx/store';
import * as AuthActions from './auth.actions';
import { initialAuthState, AuthState } from './auth.state';

export const authReducer = createReducer(
  initialAuthState,
  on(AuthActions.login, (state): AuthState => ({
    ...state,
    isLoading: true,
    errorMessage: null
  })),
  on(AuthActions.loginSuccess, (state, { user }): AuthState => ({
    ...state,
    isLoading: false,
    isAuthenticated: true,
    user,
    errorMessage: null
  })),
  on(AuthActions.loginFailure, (state, { errorMessage }): AuthState => ({
    ...state,
    isLoading: false,
    errorMessage,
    isAuthenticated: false
  })),
  on(AuthActions.logout, (): AuthState => initialAuthState),
  on(AuthActions.clearError, (state): AuthState => ({
    ...state,
    errorMessage: null
  }))
);
