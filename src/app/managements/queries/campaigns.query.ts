import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { CampaignService } from '../../data/services/campaigns.service';
import { CampaignSearchFilters } from '../params/campaigns.params';
import { CampaignSearchResponse } from '../dtos/campaigns.dto';
import { CampaignsCache, CampaignsCacheRecord } from '../../data/caches/campaigns.cache';
import { CacheDataSource } from '../../core/datasources/cache.datasource';

export type QueryPurpose = 'list' | 'templates' | 'detail' | 'refresh';

@Injectable()
export class CampaignsQuery {
	constructor(
		private readonly campaignService: CampaignService,
		private readonly campaignsCache: CampaignsCache,
		private readonly cacheDataSource: CacheDataSource,
	) {}

	private mapPurposeToPolicy(purpose?: QueryPurpose): 'cache-first' | 'network-first' | 'cache-and-network' {
		switch (purpose) {
			case 'templates':
				return 'cache-first';
			case 'detail':
				return 'cache-and-network';
			case 'refresh':
				return 'network-first';
			case 'list':
			default:
				return 'network-first';
		}
	}

	loadCampaigns(
		filters: CampaignSearchFilters,
		purpose?: QueryPurpose,
	): Observable<CampaignsCacheRecord<CampaignSearchResponse>> {
		const key = this.campaignsCache.buildCampaignsCacheKey(filters);

		// Peek cached record even if stale so we can apply stale-while-revalidate.
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

		const policy = this.mapPurposeToPolicy(purpose);

		// default stale time 30s; adjust per-query if needed
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
