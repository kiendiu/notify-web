import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Endpoint } from '../../core/constants/endpoint';
import { CampaignCreateRequest, CampaignCreateResponse, CampaignSearchResponse } from '../../managements/dtos/campaigns.dto';
import { CampaignSearchFilters } from '../../managements/params/campaigns.params';
import { API_ENGINE, ApiEngine } from '../../core/stores/api/api.engine.interface';

@Injectable()
export class CampaignService {
	constructor(@Inject(API_ENGINE) private readonly apiEngine: ApiEngine) {}
	searchCampaigns(filters: CampaignSearchFilters): Observable<CampaignSearchResponse> {
		return this.apiEngine.get<CampaignSearchResponse>(Endpoint.CAMPAIGNS.SEARCH, {
			params: {
				page: filters.page,
				size: filters.size,
				sortDirection: filters.sortDirection,
				...(filters.status !== 'ALL' && { status: filters.status }),
				...(filters.campaignName.trim() && { campaignName: filters.campaignName.trim() }),
			},
		});
	}
	
	// createCampaign(request: CampaignCreateRequest): Observable<CampaignCreateResponse> {
	// 	return this.apiEngine.post<CampaignCreateResponse>(Endpoint.CAMPAIGNS.CREATE, request);
	// }
}
