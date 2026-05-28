import { Injectable, inject } from '@angular/core';
import { Observable, of, tap } from 'rxjs';
import { CampaignEditorCache } from '../../data/caches/campaign-editor.cache';
import { CampaignEditorService } from '../../data/services/campaign-editor.service';
import { CampaignCreateRequest, CampaignCreateResponse } from '../models/campaigns.model';
import { CampaignEditorState, TemplateDto, UsersSearchResponse } from '../states/campaign-editor.state';

@Injectable()
export class CampaignEditorQuery {
    private readonly campaignEditorCache = inject(CampaignEditorCache);
    private readonly campaignEditorApiService = inject(CampaignEditorService);
    private readonly campaignEditorState = inject(CampaignEditorState);

    loadTemplates(): Observable<TemplateDto[]> {
        const cachedTemplates = this.campaignEditorCache.getTemplates();

        if (cachedTemplates !== null) {
            return of(cachedTemplates);
        }
        
        return this.campaignEditorApiService
            .getTemplates()
            .pipe(
                tap((templates) => {
                    this.campaignEditorCache.setTemplates(templates);
                }),
            );
    }

    searchUsers(
        keyword: string,
        page: number,
        size: number,
    ): Observable<UsersSearchResponse> {
        const cachedResponse = this.campaignEditorCache.getUsers(
            keyword,
            page,
            size,
        );

        if (cachedResponse !== null) {
            return of(cachedResponse);
        }
        
        return this.campaignEditorApiService
            .searchUsers(keyword, page, size)
            .pipe(
                tap((response) => {
                    this.campaignEditorCache.setUsers(
                        keyword,
                        page,
                        size,
                        response,
                    );
                }),
            );
    }

    createCampaign(
        request: CampaignCreateRequest,
    ): Observable<CampaignCreateResponse> {
        return this.campaignEditorApiService.createCampaign(request);
    }
}