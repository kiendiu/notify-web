import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiConstant } from '../core/constants/api.constant';
import { CampaignCreateRequest, CampaignCreateResponse, CampaignSearchFilters, CampaignSearchResponse } from '../management/models/campaign.model';
import { BaseApiService } from '../core/services/base_api.service';

@Injectable({ providedIn: 'root' })
export class CampaignService extends BaseApiService {
  constructor(http: HttpClient) {
    super();
    this.http = http;
  }

  searchCampaigns(filters: CampaignSearchFilters): Observable<CampaignSearchResponse> {
    let params = new HttpParams()
      .set('page', filters.page)
      .set('size', filters.size)
      .set('sortDirection', filters.sortDirection);
    if (filters.status !== 'ALL') {
      params = params.set('status', filters.status);
    }
    if (filters.campaignName.trim()) {
      params = params.set('campaignName', filters.campaignName.trim());
    }
    return this.http.get<CampaignSearchResponse>(
      ApiConstant.CAMPAIGNS.SEARCH,
      { params },
    );
  }

  createCampaign(request: CampaignCreateRequest): Observable<CampaignCreateResponse> {
    return this.http.post<CampaignCreateResponse>(
      ApiConstant.CAMPAIGNS.CREATE,
      request,
    );
  }
}
// import { Injectable } from '@angular/core';
// import { HttpParams } from '@angular/common/http';
// import { Observable } from 'rxjs';
// import { ApiConstant } from '../core/constants/api.constant';
// import { BaseApiService } from '../core/services/base_api.service';
// import { CampaignCreateRequest, CampaignSearchFilters, CampaignSearchResponse } from '../management/models/campaign.model';
// import { TemplateDto, TemplatePreviewDto, UsersSearchResponse } from '../management/stores/preview/preview.state';
// import { TokenStorageService } from './token-storage.service';

// @Injectable({
//   providedIn: 'root',
// })
// export class CampaignService extends BaseApiService {
//   constructor(private tokenStorage: TokenStorageService) {
//     super();
//   }
//   searchCampaigns(filters: CampaignSearchFilters): Observable<CampaignSearchResponse> {
//     let params = new HttpParams()
//       .set('page', filters.page)
//       .set('size', filters.size)
//       .set('sortDirection', filters.sortDirection);

//     const trimmedName = filters.campaignName.trim();

//     if (filters.status !== 'ALL') {
//       params = params.set('status', filters.status);
//     }

//     if (trimmedName.length > 0) {
//       params = params.set('campaignName', trimmedName);
//     }

//     return this.http.get<CampaignSearchResponse>(ApiConstant.CAMPAIGNS.SEARCH, { params });
//   }

//   getAllTemplates(): Observable<TemplateDto[]> {
//     return this.http.get<TemplateDto[]>(ApiConstant.CAMPAIGNS.TEMPLATES_ALL);
//   }

//   searchUsers(keyword: string = '', page: number = 0, size: number = 10): Observable<UsersSearchResponse> {
//     let params = new HttpParams()
//       .set('page', page)
//       .set('size', size);
//     if (keyword.trim().length > 0) {
//       params = params.set('keyword', keyword.trim());
//     }

//     return this.http.get<UsersSearchResponse>(ApiConstant.CAMPAIGNS.USERS_SEARCH, { params });
//   }

//   createCampaign(campaign: CampaignCreateRequest): Observable<unknown> {
//     return this.http.post<unknown>(ApiConstant.CAMPAIGNS.CREATE, campaign);
//   }
// }