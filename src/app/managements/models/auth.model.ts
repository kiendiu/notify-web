export interface AuthResponse {
	accessToken: string;
}

export interface AuthPayload {
	idToken: string;
	fcmToken: string;
	deviceId: string;
	deviceType: string;
	deviceName: string;
	osVersion: string;
}
