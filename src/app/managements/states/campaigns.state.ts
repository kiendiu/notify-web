import { Injectable, computed, signal } from '@angular/core';
import { CampaignPage, CampaignSearchFilters, defaultCampaignFilters, defaultCampaignPage } from '../models/campaigns.model';

export interface CampaignState {
	filters: CampaignSearchFilters;
	page: CampaignPage;
	loading: boolean;
	loaded: boolean;
	lastFetched: number | null;
	errorMessage: string | null;
}

export const initialCampaignState: CampaignState = {
	filters: defaultCampaignFilters,
	page: defaultCampaignPage,
	loading: false,
	loaded: false,
	lastFetched: null,
	errorMessage: null,
};

@Injectable({ providedIn: 'root' })
export class CampaignsStateService {
	readonly filters = signal<CampaignSearchFilters>(defaultCampaignFilters);
	readonly page = signal<CampaignPage>(defaultCampaignPage);
	readonly loading = signal(false);
	readonly loaded = signal(false);
	readonly lastFetched = signal<number | null>(null);
	readonly errorMessage = signal<string | null>(null);
	readonly state = computed<CampaignState>(() => ({
		filters: this.filters(),
		page: this.page(),
		loading: this.loading(),
		loaded: this.loaded(),
		lastFetched: this.lastFetched(),
		errorMessage: this.errorMessage(),
	}));

	setFilters(filters: CampaignSearchFilters): void { this.filters.set(filters); }
	setPage(page: CampaignPage): void { this.page.set(page); }
	setLoading(loading: boolean): void { this.loading.set(loading); }
	setLoaded(loaded: boolean): void { this.loaded.set(loaded); }
	setLastFetched(lastFetched: number | null): void { this.lastFetched.set(lastFetched); }
	setErrorMessage(errorMessage: string | null): void { this.errorMessage.set(errorMessage); }
	reset(): void {
		this.filters.set(defaultCampaignFilters);
		this.page.set(defaultCampaignPage);
		this.loading.set(false);
		this.loaded.set(false);
		this.lastFetched.set(null);
		this.errorMessage.set(null);
	}
}