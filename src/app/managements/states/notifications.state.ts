import { Injectable, computed, signal } from '@angular/core';
import { CampaignNotificationFilters, CampaignNotificationPage, defaultNotificationFilters, defaultNotificationPage } from '../models/notifications.model';

export interface NotificationState {
	activeCampaignId: string | null;
	filters: CampaignNotificationFilters;
	page: CampaignNotificationPage;
	loading: boolean;
	loaded: boolean;
	lastFetched: number | null;
	errorMessage: string | null;
	retryLoading: boolean;
	retryingNotificationId: string | number | null;
	retryErrorMessage: string | null;
}

export const initialNotificationState: NotificationState = {
	activeCampaignId: null,
	filters: defaultNotificationFilters,
	page: defaultNotificationPage,
	loading: false,
	loaded: false,
	lastFetched: null,
	errorMessage: null,
	retryLoading: false,
	retryingNotificationId: null,
	retryErrorMessage: null,
};

@Injectable({ providedIn: 'root' })
export class NotificationsStateService {
	readonly activeCampaignId = signal<string | null>(null);
	readonly filters = signal<CampaignNotificationFilters>(defaultNotificationFilters);
	readonly page = signal<CampaignNotificationPage>(defaultNotificationPage);
	readonly loading = signal(false);
	readonly loaded = signal(false);
	readonly lastFetched = signal<number | null>(null);
	readonly errorMessage = signal<string | null>(null);
	readonly retryLoading = signal(false);
	readonly retryingNotificationId = signal<string | number | null>(null);
	readonly retryErrorMessage = signal<string | null>(null);
	readonly state = computed<NotificationState>(() => ({
		activeCampaignId: this.activeCampaignId(),
		filters: this.filters(),
		page: this.page(),
		loading: this.loading(),
		loaded: this.loaded(),
		lastFetched: this.lastFetched(),
		errorMessage: this.errorMessage(),
		retryLoading: this.retryLoading(),
		retryingNotificationId: this.retryingNotificationId(),
		retryErrorMessage: this.retryErrorMessage(),
	}));

	reset(): void {
		this.activeCampaignId.set(null);
		this.filters.set(defaultNotificationFilters);
		this.page.set(defaultNotificationPage);
		this.loading.set(false);
		this.loaded.set(false);
		this.lastFetched.set(null);
		this.errorMessage.set(null);
		this.retryLoading.set(false);
		this.retryingNotificationId.set(null);
		this.retryErrorMessage.set(null);
	}
}