import { Injectable, OnDestroy, inject } from '@angular/core';
import { map } from 'rxjs';
import { StateService } from '../../core/stores/state/state.service';
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

@Injectable()
export class NotificationsStateService implements OnDestroy {
	private readonly stateKey = 'kien-notify-web:state:notifications';
	private readonly stateService = inject(StateService);
	readonly state$ = this.stateService.watch<NotificationState>(this.stateKey).pipe(map((state) => state ?? createInitialNotificationState()));

	constructor() {
		if (!this.stateService.get<NotificationState>(this.stateKey)) {
			this.stateService.set(this.stateKey, createInitialNotificationState());
		}
	}

	getState(): NotificationState {
		return this.stateService.get<NotificationState>(this.stateKey) ?? createInitialNotificationState();
	}

	setActiveCampaignId(activeCampaignId: string | null): void { this.patch({ activeCampaignId }); }
	setFilters(filters: CampaignNotificationFilters): void { this.patch({ filters }); }
	setPage(page: CampaignNotificationPage): void { this.patch({ page }); }
	setLoading(loading: boolean): void { this.patch({ loading }); }
	setLoaded(loaded: boolean): void { this.patch({ loaded }); }
	setLastFetched(lastFetched: number | null): void { this.patch({ lastFetched }); }
	setErrorMessage(errorMessage: string | null): void { this.patch({ errorMessage }); }
	setRetryLoading(retryLoading: boolean): void { this.patch({ retryLoading }); }
	setRetryingNotificationId(retryingNotificationId: string | number | null): void { this.patch({ retryingNotificationId }); }
	setRetryErrorMessage(retryErrorMessage: string | null): void { this.patch({ retryErrorMessage }); }

	reset(): void {
		this.stateService.set(this.stateKey, createInitialNotificationState());
	}

	ngOnDestroy(): void {
		this.stateService.remove(this.stateKey);
	}

	private patch(partial: Partial<NotificationState>): void {
		this.stateService.update<NotificationState>(this.stateKey, (current) => ({
			...createInitialNotificationState(),
			...(current ?? createInitialNotificationState()),
			...partial,
		}));
	}
}

function createInitialNotificationState(): NotificationState {
	return {
		activeCampaignId: null,
		filters: { ...defaultNotificationFilters },
		page: { ...defaultNotificationPage },
		loading: false,
		loaded: false,
		lastFetched: null,
		errorMessage: null,
		retryLoading: false,
		retryingNotificationId: null,
		retryErrorMessage: null,
	};
}