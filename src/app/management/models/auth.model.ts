export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
}

export interface AuthPayload {
  idToken: string;
  fcmToken: string;
  deviceId: string;
  deviceType: string;
  deviceName: string;
  osVersion: string;
}

export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  tokenType: string | null;
  isAuthenticated: boolean;
}
