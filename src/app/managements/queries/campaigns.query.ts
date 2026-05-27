import { Injectable, inject } from '@angular/core';
import { Observable, Subscription, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { NotificationWsService } from '../../core/websocket/notification-ws.service';
import { CampaignService } from '../../data/services/campaigns.service';
import { CampaignCreateRequest, CampaignCreateResponse, CampaignSearchFilters, normalizeCampaignPage } from '../models/campaigns.model';
import { CampaignsStateService } from '../states/campaigns.state';
import { CampaignEditorQuery } from './campaign-editor.query';

@Injectable({ providedIn: 'root' })
export class CampaignsQuery {
	private readonly campaignService = inject(CampaignService);
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
		this.campaignsState.filters.update((current) => ({ ...current, campaignName, page: 0 }));
	}

	setCampaignPage(page: number): void {
		this.campaignsState.filters.update((current) => ({ ...current, page }));
	}

	setCampaignStatus(status: string): void {
		this.campaignsState.filters.update((current) => ({ ...current, status: status as CampaignSearchFilters['status'], page: 0 }));
	}

	setCampaignSortDirection(sortDirection: string): void {
		this.campaignsState.filters.update((current) => ({ ...current, sortDirection: sortDirection as CampaignSearchFilters['sortDirection'], page: 0 }));
	}

	setCampaignSize(size: number): void {
		this.campaignsState.filters.update((current) => ({ ...current, size, page: 0 }));
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
		const filters = this.campaignsState.filters();
		this.campaignsState.setLoading(true);
		this.campaignsState.setErrorMessage(null);

		this.campaignService.searchCampaigns(filters).pipe(
			tap((response) => {
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
}
