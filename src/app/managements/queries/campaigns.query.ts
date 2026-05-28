import { Injectable, inject } from '@angular/core';
import { Observable, map, of } from 'rxjs';
import { CampaignService } from '../../data/services/campaigns.service';
import { CampaignSearchFilters, CampaignSearchResponse } from '../models/campaigns.model';
import { CampaignsCache, CampaignsCacheRecord } from '../../data/caches/campaigns.cache';

@Injectable()
export class CampaignsQuery {
	private readonly campaignService = inject(CampaignService);
	private readonly campaignsCache = inject(CampaignsCache);

	loadCampaigns(filters: CampaignSearchFilters): Observable<CampaignsCacheRecord<CampaignSearchResponse>> {
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
