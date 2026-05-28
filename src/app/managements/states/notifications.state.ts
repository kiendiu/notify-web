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

	resetCampaignFilters(): void { this.patch({ filters: { ...defaultNotificationFilters } }); }
	
	setKeyword(keyword: string): void { this.patchFilters({ keyWord: keyword, page: 0 }); }

	setChannel(channel: CampaignNotificationFilters['channel']): void { this.patchFilters({ channel, page: 0 }); }

	setStatus(status: CampaignNotificationFilters['status']): void { this.patchFilters({ status, page: 0 }); }

	setPageIndex(page: number): void { this.patchFilters({ page }); }

	setFiltersToFirstPage(): void { this.patchFilters({ page: 0 }); }

	setPage(page: CampaignNotificationPage): void { this.patch({ page }); }

	setLoading(loading: boolean): void { this.patch({ loading }); }

	setLoaded(loaded: boolean): void { this.patch({ loaded }); }

	setLastFetched(lastFetched: number | null): void { this.patch({ lastFetched }); }

	setErrorMessage(errorMessage: string | null): void { this.patch({ errorMessage }); }

	setRetryLoading(retryLoading: boolean): void { this.patch({ retryLoading }); }

	setRetryingNotificationId(retryingNotificationId: string | number | null): void { this.patch({ retryingNotificationId }); }

	setRetryErrorMessage(retryErrorMessage: string | null): void { this.patch({ retryErrorMessage }); }

	markNotificationPending(notificationId: string | number): void {
		const currentPage = this.getState().page;
		const nextItems = currentPage.items.map((item) => (
			String(item.id) === String(notificationId)
				? { ...item, status: 'PENDING' }
				: item
		));

		if (nextItems === currentPage.items) {
			return;
		}

		this.patch({ page: { ...currentPage, items: nextItems } });
	}
	clear(): void { this.reset(); }

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

	private patchFilters(partial: Partial<CampaignNotificationFilters> & { page?: number }): void {
		this.patch({ filters: { ...this.getState().filters, ...partial } });
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