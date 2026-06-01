import { Injectable } from '@angular/core';
import { NotificationDetailsResponse } from '../dtos/notifications.dto';
import { normalizeNotificationDetails } from '../mappers/notifications.mapper';
import { CampaignNotificationSummary, NotificationDeviceDetail } from '../models/notifications.model';

export interface NotificationDetailState {
	selectedNotificationId: string | number | null;
	selectedNotification: CampaignNotificationSummary | null;
	notificationDetails: NotificationDeviceDetail[];
	notificationDetailsLoading: boolean;
	notificationDetailsErrorMessage: string | null;
	showNotificationDetailsPanel: boolean;
	retryLoading: boolean;
	retryError: string | null;
	retryingDeviceId: string | null;
}

export const initialNotificationDetailState: NotificationDetailState = {
	selectedNotificationId: null,
	selectedNotification: null,
	notificationDetails: [],
	notificationDetailsLoading: false,
	notificationDetailsErrorMessage: null,
	showNotificationDetailsPanel: false,
	retryLoading: false,
	retryError: null,
	retryingDeviceId: null,
};

@Injectable()
export class NotificationDetailStateService {
	private state: NotificationDetailState = createInitialNotificationDetailState();

	getState(): NotificationDetailState {
		return this.state;
	}

	setSelectedNotification(selectedNotification: CampaignNotificationSummary | null): void {
		this.state = { ...this.state, selectedNotification, selectedNotificationId: selectedNotification?.id ?? null };
	}

	setPanelVisible(showNotificationDetailsPanel: boolean): void {
		this.state = { ...this.state, showNotificationDetailsPanel };
	}

	openPanel(selectedNotification: CampaignNotificationSummary | null): void {
		const sameNotification = this.state.selectedNotificationId !== null && selectedNotification?.id === this.state.selectedNotificationId;
		const preserveDetails = sameNotification && this.state.notificationDetails.length > 0;
		this.state = {
			...this.state,
			selectedNotification,
			selectedNotificationId: selectedNotification?.id ?? null,
			showNotificationDetailsPanel: true,
			notificationDetails: preserveDetails ? this.state.notificationDetails : [],
			notificationDetailsLoading: preserveDetails ? this.state.notificationDetailsLoading : true,
			notificationDetailsErrorMessage: preserveDetails ? this.state.notificationDetailsErrorMessage : null,
			retryingDeviceId: preserveDetails ? this.state.retryingDeviceId : null,
		};
	}

	closePanel(): void {
		this.state = {
			...this.state,
			showNotificationDetailsPanel: false,
		};
	}

	setNotificationDetails(notificationDetails: NotificationDeviceDetail[]): void {
		this.state = { ...this.state, notificationDetails };
	}

	setNotificationDetailsFromResponse(response: NotificationDetailsResponse): void {
		this.state = {
			...this.state,
			notificationDetails: normalizeNotificationDetails(response),
			notificationDetailsLoading: false,
			notificationDetailsErrorMessage: null,
		};
	}

	startLoadingNotificationDetails(): void {
		this.state = { ...this.state, notificationDetailsLoading: true, notificationDetailsErrorMessage: null };
	}

	setNotificationDetailsError(): void {
		this.state = {
			...this.state,
			notificationDetailsLoading: false,
			notificationDetailsErrorMessage: 'Không thể tải chi tiết thiết bị. Vui lòng thử lại.',
		};
	}

	updateNotificationDetail(detailId: number, nextDetail: Partial<NotificationDeviceDetail>): void {
		this.state = {
			...this.state,
			notificationDetails: this.state.notificationDetails.map((item) => (
				item.id === detailId ? { ...item, ...nextDetail } : item
			)),
		};
	}

	updateNotificationDetailByDeviceId(deviceId: string, nextDetail: Partial<NotificationDeviceDetail>): void {
		this.state = {
			...this.state,
			notificationDetails: this.state.notificationDetails.map((item) => (
				(item.deviceId ?? '') === deviceId ? { ...item, ...nextDetail } : item
			)),
		};
	}

	updateNotificationDetailByLogId(detailId: number, nextDetail: Partial<NotificationDeviceDetail>): void {
		this.updateNotificationDetail(detailId, nextDetail);
	}

	markNotificationDetailRetryPending(detailId: number, retryingDeviceId: string): void {
		const currentDetail = this.state.notificationDetails.find((item) => item.id === detailId);
		if (!currentDetail) {
			return;
		}

		this.state = {
			...this.state,
			retryingDeviceId,
			notificationDetails: this.state.notificationDetails.map((item) => (
				item.id === detailId
					? { ...item, status: 'PENDING', errorMessage: null }
					: item
			)),
		};
	}

	restoreNotificationDetail(detail: NotificationDeviceDetail): void {
		this.state = {
			...this.state,
			retryingDeviceId: null,
			notificationDetails: this.state.notificationDetails.map((item) => (
				item.id === detail.id ? detail : item
			)),
		};
	}

	setNotificationDetailsLoading(notificationDetailsLoading: boolean): void {
		this.state = { ...this.state, notificationDetailsLoading };
	}

	setNotificationDetailsErrorMessage(notificationDetailsErrorMessage: string | null): void {
		this.state = { ...this.state, notificationDetailsErrorMessage };
	}

	setShowNotificationDetailsPanel(showNotificationDetailsPanel: boolean): void {
		this.state = { ...this.state, showNotificationDetailsPanel };
	}

	setRetryLoading(retryLoading: boolean): void {
		this.state = { ...this.state, retryLoading };
	}

	setRetryError(retryError: string | null): void {
		this.state = { ...this.state, retryError };
	}

	setRetryingDeviceId(retryingDeviceId: string | null): void {
		this.state = { ...this.state, retryingDeviceId };
	}

	reset(): void {
		this.state = createInitialNotificationDetailState();
	}
}

function createInitialNotificationDetailState(): NotificationDetailState {
	return { ...initialNotificationDetailState };
}