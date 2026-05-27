export interface NotificationDetailState {
	loading: boolean;
	errorMessage: string | null;
	selectedNotificationId: number | null;
}

export const initialNotificationDetailState: NotificationDetailState = {
	loading: false,
	errorMessage: null,
	selectedNotificationId: null,
};