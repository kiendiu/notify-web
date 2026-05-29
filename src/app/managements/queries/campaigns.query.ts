import { Injectable } from '@angular/core';
import { Observable, map, of } from 'rxjs';
import { CampaignService } from '../../data/services/campaigns.service';
import { CampaignSearchFilters } from '../params/campaigns.params';
import { CampaignSearchResponse } from '../dtos/campaigns.dto';
import { CampaignsCache, CampaignsCacheRecord } from '../../data/caches/campaigns.cache';

@Injectable()
export class CampaignsQuery {
	constructor(
		private readonly campaignService: CampaignService,
		private readonly campaignsCache: CampaignsCache,
	) {}

	loadCampaigns(
		filters: CampaignSearchFilters,
		options?: { forceRefresh?: boolean },
	): Observable<CampaignsCacheRecord<CampaignSearchResponse>> {
		if (options?.forceRefresh) {
			this.campaignsCache.clearCampaigns();
		}

		const cached = this.campaignsCache.getCampaigns(filters);
		if (cached) {
			return of(cached);
		}

		return this.campaignService.searchCampaigns(filters).pipe(
			map((response) => {
				this.campaignsCache.setCampaigns(filters, response);
				return {
					value: response,
					fetchedAt: Date.now(),
				};
			}),
		);
	}
}
