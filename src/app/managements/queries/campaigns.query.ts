import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { CampaignService } from '../../data/services/campaigns.service';
import { CampaignSearchFilters } from '../params/campaigns.params';
import { CampaignSearchResponse } from '../dtos/campaigns.dto';
import { CampaignsCache, CampaignsCacheRecord } from '../../data/caches/campaigns.cache';
import { CacheDataSource, OptionCachePolicy } from '../../core/stores/cache/cache.datasource';

@Injectable()
export class CampaignsQuery {
	constructor(
		private readonly campaignService: CampaignService,
		private readonly campaignsCache: CampaignsCache,
		private readonly cacheDataSource: CacheDataSource,
	) {}

	loadCampaigns(
		filters: CampaignSearchFilters,
		policy: OptionCachePolicy = 'network-first',
	): Observable<CampaignsCacheRecord<CampaignSearchResponse>> {
		const key = this.campaignsCache.buildCampaignsCacheKey(filters);

		const cached = this.campaignsCache.peekCampaigns(filters);

		const network$ = this.campaignService.searchCampaigns(filters).pipe(
			map((response) => {
				this.campaignsCache.setCampaigns(filters, response);
				return {
					value: response,
					fetchedAt: Date.now(),
				};
			}),
		);

		const staleTimeMs = 30_000;

		return this.cacheDataSource.query<CampaignSearchResponse>(
			key,
			cached,
			network$,
			policy,
			staleTimeMs,
		);
	}
}
