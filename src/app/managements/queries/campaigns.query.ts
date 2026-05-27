import { Injectable, OnDestroy, inject } from '@angular/core';
import { Observable, Subscription, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { NotificationWsService } from '../../core/websocket/notification-ws.service';
import { CampaignService } from '../../data/services/campaigns.service';
import { CampaignCreateRequest, CampaignCreateResponse, CampaignSearchFilters, normalizeCampaignPage } from '../models/campaigns.model';
import { CampaignsStateService } from '../states/campaigns.state';
import { CampaignEditorQuery } from './campaign-editor.query';
import { CACHE_ENGINE } from '../../core/stores/cache/cache.engine';
import { buildCampaignsCacheKey, CAMPAIGNS_TTL_MS } from '../../data/caches/campaigns.cache';

@Injectable()
export class CampaignsQuery implements OnDestroy {
	private readonly campaignService = inject(CampaignService);
    private readonly cacheEngine = inject(CACHE_ENGINE);
	private readonly campaignsState = inject(CampaignsStateService);
	private readonly campaignEditorQuery = inject(CampaignEditorQuery);
	private readonly websocket = inject(NotificationWsService);
	private realtimeSubscription: Subscription | null = null;

	connectRealtime(): void {
		if (this.realtimeSubscription) {
			return;
		}

		this.realtimeSubscription = this.websocket.watchCampaigns().subscribe(() => {
			this.loadCampaigns();
		});
	}

	setCampaignName(campaignName: string): void {
		this.campaignsState.setFilters({ ...this.campaignsState.getState().filters, campaignName, page: 0 });
	}

	setCampaignPage(page: number): void {
		this.campaignsState.setFilters({ ...this.campaignsState.getState().filters, page });
	}

	setCampaignStatus(status: string): void {
		this.campaignsState.setFilters({ ...this.campaignsState.getState().filters, status: status as CampaignSearchFilters['status'], page: 0 });
	}

	setCampaignSortDirection(sortDirection: string): void {
		this.campaignsState.setFilters({ ...this.campaignsState.getState().filters, sortDirection: sortDirection as CampaignSearchFilters['sortDirection'], page: 0 });
	}

	setCampaignSize(size: number): void {
		this.campaignsState.setFilters({ ...this.campaignsState.getState().filters, size, page: 0 });
	}

	loadTemplates(): void {
		this.campaignEditorQuery.loadTemplates().subscribe();
	}

	clearPreview(): void {
		this.campaignEditorQuery.clearPreview();
	}

	loadCampaignEditorTemplates(): void {
		this.campaignEditorQuery.loadTemplates().subscribe();
	}

	loadCampaignEditorUsers(keyword: string, page: number, size: number): void {
		this.campaignEditorQuery.searchUsers(keyword, page, size).subscribe();
	}

	loadCampaigns(): void {
		const filters = this.campaignsState.getState().filters;
		this.campaignsState.setLoading(true);
		this.campaignsState.setErrorMessage(null);

		const cacheKey = buildCampaignsCacheKey(filters);
		const cached = this.cacheEngine.get<any>(cacheKey);
		if (this.cacheEngine.isFresh(cached, CAMPAIGNS_TTL_MS)) {
			const page = normalizeCampaignPage(cached!.value);
			this.campaignsState.setPage(page);
			this.campaignsState.setLoaded(true);
			this.campaignsState.setLastFetched(cached!.fetchedAt ?? Date.now());
			this.campaignsState.setLoading(false);
			return;
		}

		this.campaignService.searchCampaigns(filters).pipe(
			tap((response) => {
				this.cacheEngine.set(cacheKey, response);
				const page = normalizeCampaignPage(response);
				this.campaignsState.setPage(page);
				this.campaignsState.setLoaded(true);
				this.campaignsState.setLastFetched(Date.now());
				this.campaignsState.setLoading(false);
			}),
			tap({
				error: () => {
					this.campaignsState.setLoading(false);
					this.campaignsState.setErrorMessage('Không thể tải danh sách chiến dịch.');
				},
			}),
		).subscribe();
	}

	createCampaign(request: CampaignCreateRequest): Observable<CampaignCreateResponse> {
		return this.campaignService.createCampaign(request).pipe(
			tap(() => {
				this.campaignsState.setLoaded(false);
			}),
		);
	}

	ngOnDestroy(): void {
		this.realtimeSubscription?.unsubscribe();
		this.realtimeSubscription = null;
	}
}
