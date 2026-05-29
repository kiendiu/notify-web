import { Injectable, OnDestroy } from '@angular/core';
import { map } from 'rxjs';
import { StateService } from '../../core/stores/state/state.service';
import { CampaignPage } from '../models/campaigns.model';
import { CampaignSearchFilters, defaultCampaignFilters } from '../params/campaigns.params';

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
	page: {
		items: [],
		number: 0,
		size: 10,
		totalElements: 0,
		totalPages: 0,
		first: true,
		last: true,
	},
	loading: false,
	loaded: false,
	lastFetched: null,
	errorMessage: null,
};

@Injectable()
export class CampaignsStateService {
	private readonly stateKey = 'kien-notify-web:state:campaigns';
	readonly state$;

	constructor(private readonly stateService: StateService) {
		this.state$ = this.stateService.watch<CampaignState>(this.stateKey).pipe(map((state) => state ?? createInitialCampaignState()));
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
		page: {
			items: [],
			number: 0,
			size: 10,
			totalElements: 0,
			totalPages: 0,
			first: true,
			last: true,
		},
		loading: false,
		loaded: false,
		lastFetched: null,
		errorMessage: null,
	};
}