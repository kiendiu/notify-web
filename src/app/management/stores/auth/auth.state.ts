export interface AuthState {
  isLoading: boolean;
  errorMessage: string | null;
  isAuthenticated: boolean;
  user: any | null;
}

export const initialAuthState: AuthState = {
  isLoading: false,
  errorMessage: null,
  isAuthenticated: false,
  user: null
};
