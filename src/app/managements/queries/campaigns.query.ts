import { Injectable } from '@angular/core';
import { Observable, catchError, concat, map, of, throwError } from 'rxjs';
import { CampaignService } from '../../data/services/campaigns.service';
import { CampaignSearchFilters } from '../params/campaigns.params';
import { CampaignSearchResponse } from '../dtos/campaigns.dto';
import { CampaignsCache, CampaignsCacheRecord } from '../../data/caches/campaigns.cache';
import { OptionCachePolicy } from '../policy/cache-policy';

@Injectable()
export class CampaignsQuery {
	constructor(
		private readonly campaignService: CampaignService,
		private readonly campaignsCache: CampaignsCache,
	) {}

	loadCampaigns(
		filters: CampaignSearchFilters,
		optionCachePolicy?: OptionCachePolicy,
	): Observable<CampaignsCacheRecord<CampaignSearchResponse>> {
		const cached = this.campaignsCache.getCampaigns(filters);
		const network$ = this.campaignService.searchCampaigns(filters).pipe(
			map((response) => {
				this.campaignsCache.setCampaigns(filters, response);
				return {
					value: response,
					fetchedAt: Date.now(),
				};
			}),
		);

		switch (optionCachePolicy) {
			case 'cache-first':
				return cached ? of(cached) : network$;

			case 'cache-and-network':
				return cached ? concat(of(cached), network$) : network$;

			case 'network-first':
			default:
				return network$.pipe(
					catchError((error: unknown) => {
						if (cached) {
							return of(cached);
						}
						return throwError(() => error);
					}),
				);
		}
	}
}
