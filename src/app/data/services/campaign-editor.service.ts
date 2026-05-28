import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_ENGINE } from '../../core/stores/api/api.engine.interface';
import { Endpoint } from '../../core/constants/endpoint';

import {
    CampaignChannel,
    CampaignCreateRequest,
    CampaignCreateResponse,
    CampaignTargetType,
} from '../../managements/models/campaigns.model';

import {
    TemplateDto,
    UsersSearchResponse,
} from '../../managements/states/campaign-editor.state';

@Injectable()
export class CampaignEditorService {
    private readonly apiEngine = inject(API_ENGINE);

    getTemplates(): Observable<TemplateDto[]> {
        return this.apiEngine.get<TemplateDto[]>(
            Endpoint.CAMPAIGNS.TEMPLATES_ALL,
        );
    }

    searchUsers(
        keyword: string,
        page: number,
        size: number,
    ): Observable<UsersSearchResponse> {
        return this.apiEngine.get<UsersSearchResponse>(
            Endpoint.CAMPAIGNS.USERS_SEARCH,
            {
                params: {
                    page,
                    size,
                    ...(keyword?.trim() && {
                        keyword: keyword.trim(),
                    }),
                },
            },
        );
    }

    createCampaign(
        request: CampaignCreateRequest,
    ): Observable<CampaignCreateResponse> {
        return this.apiEngine.post<CampaignCreateResponse>(
            Endpoint.CAMPAIGNS.CREATE,
            request,
        );
    }
}