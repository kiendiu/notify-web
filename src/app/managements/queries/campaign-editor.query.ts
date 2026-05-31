import { Injectable } from '@angular/core';
import { Observable, of, tap, map } from 'rxjs';
import { CampaignEditorCache } from '../../data/caches/campaign-editor.cache';
import { CampaignEditorService } from '../../data/services/campaign-editor.service';
import { CampaignCreateRequest, CampaignCreateResponse } from '../dtos/campaigns.dto';
import { TemplateDto, UsersSearchResponse } from '../dtos/campaign-editor.dto';
import { CampaignEditorState } from '../states/campaign-editor.state';
import { CacheDataSource } from '../../core/datasources/cache.datasource';
import { OptionCachePolicy } from '../../core/datasources/cache.datasource';

@Injectable()
export class CampaignEditorQuery {
    constructor(
        private readonly campaignEditorCache: CampaignEditorCache,
        private readonly campaignEditorApiService: CampaignEditorService,
        private readonly campaignEditorState: CampaignEditorState,
        private readonly cacheDataSource: CacheDataSource,
    ) {}

    loadTemplates(policy: OptionCachePolicy = 'cache-first'): Observable<TemplateDto[]> {
        const key = this.campaignEditorCache.buildTemplatesCacheKey();

        const cached = this.campaignEditorCache.peekTemplates();
        const network$ = this.campaignEditorApiService.getTemplates().pipe(
            tap((templates) => this.campaignEditorCache.setTemplates(templates)),
            map((templates) => ({ value: templates, fetchedAt: Date.now() })),
        );
        return this.cacheDataSource
            .query<TemplateDto[]>(key, cached, network$, policy)
            .pipe(map((r) => r.value));
    }

    searchUsers(
        keyword: string,
        page: number,
        size: number,
        policy: OptionCachePolicy = 'network-first',
    ): Observable<UsersSearchResponse> {
        const key = this.campaignEditorCache.buildUsersCacheKey(keyword, page, size);
        const cached = this.campaignEditorCache.peekUsers(keyword, page, size);
        const network$ = this.campaignEditorApiService.searchUsers(keyword, page, size).pipe(
            tap((response) => this.campaignEditorCache.setUsers(keyword, page, size, response)),
            map((response) => ({ value: response, fetchedAt: Date.now() })),
        );
        return this.cacheDataSource
            .query<UsersSearchResponse>(key, cached, network$, policy)
            .pipe(map((r) => r.value));
    }

    createCampaign(
        request: CampaignCreateRequest,
    ): Observable<CampaignCreateResponse> {
        return this.campaignEditorApiService.createCampaign(request);
    }
}