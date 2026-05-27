import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiConstant } from '../../core/constants/api.constant';
import { CampaignCreateRequest, CampaignCreateResponse, CampaignSearchFilters, CampaignSearchResponse } from '../../managements/models/campaigns.model';
import { API_ENGINE } from '../../core/stores/api/api.engine.interface';

@Injectable({ providedIn: 'root' })
export class CampaignService {
	private readonly apiEngine = inject(API_ENGINE);
	searchCampaigns(filters: CampaignSearchFilters): Observable<CampaignSearchResponse> {
		return this.apiEngine.get<CampaignSearchResponse>(ApiConstant.CAMPAIGNS.SEARCH, {
			params: {
				page: filters.page,
				size: filters.size,
				sortDirection: filters.sortDirection,
				...(filters.status !== 'ALL' && { status: filters.status }),
				...(filters.campaignName.trim() && { campaignName: filters.campaignName.trim() }),
			},
		});
	}

	createCampaign(request: CampaignCreateRequest): Observable<CampaignCreateResponse> {
		return this.apiEngine.post<CampaignCreateResponse>(ApiConstant.CAMPAIGNS.CREATE, request);
	}
}
