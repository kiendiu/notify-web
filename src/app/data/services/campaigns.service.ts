import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiConstant } from '../../core/constants/api.constant';
import { CampaignCreateRequest, CampaignCreateResponse, CampaignSearchFilters, CampaignSearchResponse } from '../../managements/models/campaigns.model';
import { API_ENGINE } from '../../core/stores/api/api.engine.interface';
import { CACHE_ENGINE } from '../../core/stores/cache/cache.engine';
import { buildCampaignsCacheKey, CAMPAIGNS_TTL_MS } from '../caches/campaigns.cache';

@Injectable({ providedIn: 'root' })
export class CampaignService {
	private readonly apiEngine = inject(API_ENGINE);
	private readonly cacheEngine = inject(CACHE_ENGINE);

	searchCampaigns(filters: CampaignSearchFilters): Observable<CampaignSearchResponse> {
		const cacheKey = buildCampaignsCacheKey(filters);
		const cachedEntry = this.cacheEngine.get<CampaignSearchResponse>(cacheKey);

		if (this.cacheEngine.isFresh(cachedEntry, CAMPAIGNS_TTL_MS)) {
			return new Observable((observer) => {
				observer.next(cachedEntry!.value);
				observer.complete();
			});
		}

		return new Observable((observer) => {
			this.apiEngine
				.get<CampaignSearchResponse>(ApiConstant.CAMPAIGNS.SEARCH, {
					params: {
						page: filters.page,
						size: filters.size,
						sortDirection: filters.sortDirection,
						...(filters.status !== 'ALL' && { status: filters.status }),
						...(filters.campaignName.trim() && { campaignName: filters.campaignName.trim() }),
					},
				})
				.subscribe({
					next: (response) => {
						this.cacheEngine.set(cacheKey, response);
						observer.next(response);
						observer.complete();
					},
					error: (err) => observer.error(err),
				});
		});
	}

	createCampaign(request: CampaignCreateRequest): Observable<CampaignCreateResponse> {
		return this.apiEngine.post<CampaignCreateResponse>(ApiConstant.CAMPAIGNS.CREATE, request);
	}
}
