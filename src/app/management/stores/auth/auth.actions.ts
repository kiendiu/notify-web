import { createAction, props } from '@ngrx/store';
import { AuthPayload } from '../../models/auth.model';

export const login = createAction(
  '[Auth] Login',
  props<{ payload: AuthPayload }>()
);

export const loginSuccess = createAction(
  '[Auth] Login Success',
  props<{ user: any }>()
);

export const loginFailure = createAction(
  '[Auth] Login Failure',
  props<{ errorMessage: string }>()
);

export const logout = createAction('[Auth] Logout');

export const clearError = createAction('[Auth] Clear Error');
