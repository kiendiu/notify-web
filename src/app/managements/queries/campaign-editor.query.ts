import { Injectable, inject } from '@angular/core';
import { Observable, of, tap } from 'rxjs';

import { CampaignEditorCache } from '../../data/caches/campaign-editor.cache';
import { CampaignEditorService } from '../../data/services/campaign-editor.service';
import {
    CampaignCreateRequest,
    CampaignCreateResponse,
} from '../models/campaigns.model';

import {
    CampaignEditorState,
    TemplateDto,
    UsersSearchResponse,
} from '../states/campaign-editor.state';

@Injectable()
export class CampaignEditorQuery {
    private readonly campaignEditorCache = inject(CampaignEditorCache);
    private readonly campaignEditorApiService = inject(CampaignEditorService);
    private readonly campaignEditorState = inject(CampaignEditorState);

    loadTemplates(): Observable<TemplateDto[]> {
        const cachedTemplates = this.campaignEditorCache.getTemplates();

        if (cachedTemplates !== null) {
            this.campaignEditorState.patch({
                templates: cachedTemplates,
                templatesLoaded: true,
                templatesLoading: false,
                templatesLastFetched: Date.now(),
            });
            return of(cachedTemplates);
        }

        this.campaignEditorState.patch({
            templatesLoading: true,
            errorMessage: null,
        });

        // Gọi API từ Service và tiến hành update state qua pipe tap
        return this.campaignEditorApiService
            .getTemplates()
            .pipe(
                tap((templates) => {
                    this.campaignEditorCache.setTemplates(templates);

                    this.campaignEditorState.patch({
                        templates,
                        templatesLoaded: true,
                        templatesLoading: false,
                        templatesLastFetched: Date.now(),
                    });
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
            this.campaignEditorState.patch({
                users: cachedResponse.content ?? [],
                usersLoaded: true,
                userSearchLoading: false,
                usersLastFetched: Date.now(),
            });
            return of(cachedResponse);
        }

        this.campaignEditorState.patch({
            userSearchLoading: true,
            errorMessage: null,
        });

        // Gọi API từ Service và tiến hành update state qua pipe tap
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

                    this.campaignEditorState.patch({
                        users: response.content ?? [],
                        usersLoaded: true,
                        userSearchLoading: false,
                        usersLastFetched: Date.now(),
                    });
                }),
            );
    }

    clearPreview(): void {
        this.campaignEditorState.patch({
            templatePreview: null,
            pushPreview: null,
            emailPreview: null,
        });
    }

    createCampaign(
        request: CampaignCreateRequest,
    ): Observable<CampaignCreateResponse> {
        // Nhận request và trả về Observable cho Component hoặc nơi cần subscribe xử lý tiếp
        return this.campaignEditorApiService.createCampaign(request);
    }
}