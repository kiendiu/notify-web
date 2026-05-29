import { AuthDeviceInfo } from '../models/auth.model';

export interface AuthPayload extends AuthDeviceInfo {
	idToken: string;
	fcmToken: string;
}