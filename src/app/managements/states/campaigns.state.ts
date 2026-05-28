import { Injectable, OnDestroy, inject } from '@angular/core';
import { map } from 'rxjs';
import { StateService } from '../../core/stores/state/state.service';
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

@Injectable()
export class CampaignsStateService {
	private readonly stateKey = 'kien-notify-web:state:campaigns';
	private readonly stateService = inject(StateService);
	readonly state$ = this.stateService.watch<CampaignState>(this.stateKey).pipe(map((state) => state ?? createInitialCampaignState()));

	constructor() {
		if (!this.stateService.get<CampaignState>(this.stateKey)) {
			this.stateService.set(this.stateKey, createInitialCampaignState());
		}
	}

	getState(): CampaignState {
		return this.stateService.get<CampaignState>(this.stateKey) ?? createInitialCampaignState();
	}

	setFilters(filters: CampaignSearchFilters): void { this.patch({ filters }); }
	
	setPage(page: CampaignPage): void { this.patch({ page }); }

	setLoading(loading: boolean): void { this.patch({ loading }); }

	setLoaded(loaded: boolean): void { this.patch({ loaded }); }

	setLastFetched(lastFetched: number | null): void { this.patch({ lastFetched }); }

	setErrorMessage(errorMessage: string | null): void { this.patch({ errorMessage }); }

	reset(): void {
		this.stateService.set(this.stateKey, createInitialCampaignState());
	}

	ngOnDestroy(): void {
		this.stateService.remove(this.stateKey);
	}

	private patch(partial: Partial<CampaignState>): void {
		this.stateService.update<CampaignState>(this.stateKey, (current) => ({
			...createInitialCampaignState(),
			...(current ?? createInitialCampaignState()),
			...partial,
		}));
	}
}

function createInitialCampaignState(): CampaignState {
	return {
		filters: { ...defaultCampaignFilters },
		page: { ...defaultCampaignPage },
		loading: false,
		loaded: false,
		lastFetched: null,
		errorMessage: null,
	};
}