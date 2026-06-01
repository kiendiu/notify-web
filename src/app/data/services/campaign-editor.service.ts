import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_ENGINE, ApiEngine } from '../../core/stores/api/api.engine.interface';
import { Endpoint } from '../../core/constants/endpoint';

import {
    CampaignChannel,
    CampaignTargetType,
} from '../../managements/models/campaigns.model';

import {
    CampaignCreateRequest,
    CampaignCreateResponse,
} from '../../managements/dtos/campaigns.dto';

import {
    TemplateDto,
    UsersSearchResponse,
} from '../../managements/dtos/campaign-editor.dto';

@Injectable()
export class CampaignEditorService {
    constructor(@Inject(API_ENGINE) private readonly apiEngine: ApiEngine) {}

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