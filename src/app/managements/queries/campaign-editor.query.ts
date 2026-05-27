import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiConstant } from '../../core/constants/api.constant';
import { API_ENGINE } from '../../core/stores/api/api.engine.interface';
import { CACHE_ENGINE } from '../../core/stores/cache/cache.engine';
import { CampaignService } from '../../data/services/campaigns.service';
import { CampaignCreateRequest, CampaignCreateResponse } from '../models/campaigns.model';
import { CampaignEditorStateService, TemplateDto, UsersSearchResponse } from '../states/campaign-editor.state';
import { buildPreviewTemplatesCacheKey, buildPreviewUsersCacheKey, CAMPAIGN_EDITOR_TTL_MS } from '../../data/caches/campaign-editor.cache';

@Injectable({ providedIn: 'root' })
export class CampaignEditorQuery {
	private readonly campaignService = inject(CampaignService);
	private readonly apiEngine = inject(API_ENGINE);
	private readonly cacheEngine = inject(CACHE_ENGINE);
	private readonly campaignEditorState = inject(CampaignEditorStateService);

	loadTemplates(): Observable<TemplateDto[]> {
		const cacheKey = buildPreviewTemplatesCacheKey();
		const cachedEntry = this.cacheEngine.get<TemplateDto[]>(cacheKey);

		if (this.cacheEngine.isFresh(cachedEntry, CAMPAIGN_EDITOR_TTL_MS)) {
			const templates = cachedEntry!.value;
			this.campaignEditorState.setTemplates(templates);
			this.campaignEditorState.setTemplatesLoaded(true);
			this.campaignEditorState.setTemplatesLastFetched(cachedEntry!.fetchedAt ?? Date.now());
			return of(templates);
		}

		this.campaignEditorState.setTemplatesLoading(true);
		this.campaignEditorState.setErrorMessage(null);

		return this.apiEngine.get<TemplateDto[]>(ApiConstant.CAMPAIGNS.TEMPLATES_ALL).pipe(
			tap((templates) => {
				this.cacheEngine.set(cacheKey, templates);
				this.campaignEditorState.setTemplates(templates);
				this.campaignEditorState.setTemplatesLoaded(true);
				this.campaignEditorState.setTemplatesLastFetched(Date.now());
				this.campaignEditorState.setTemplatesLoading(false);
			}),
		);
	}

	searchUsers(keyword: string, page: number, size: number): Observable<UsersSearchResponse> {
		const cacheKey = buildPreviewUsersCacheKey(keyword ?? '', page, size);
		const cachedEntry = this.cacheEngine.get<UsersSearchResponse>(cacheKey);

		if (this.cacheEngine.isFresh(cachedEntry, CAMPAIGN_EDITOR_TTL_MS)) {
			const response = cachedEntry!.value;
			this.campaignEditorState.setUsers(response.content ?? []);
			this.campaignEditorState.setUsersLoaded(true);
			this.campaignEditorState.setUsersLastFetched(cachedEntry!.fetchedAt ?? Date.now());
			return of(response);
		}

		this.campaignEditorState.setUserSearchLoading(true);
		this.campaignEditorState.setErrorMessage(null);

		return this.apiEngine.get<UsersSearchResponse>(ApiConstant.CAMPAIGNS.USERS_SEARCH, {
			params: {
				page,
				size,
				...(keyword?.trim() && { keyword: keyword.trim() }),
			},
		}).pipe(
			tap((response) => {
				this.cacheEngine.set(cacheKey, response);
				this.campaignEditorState.setUsers(response.content ?? []);
				this.campaignEditorState.setUsersLoaded(true);
				this.campaignEditorState.setUsersLastFetched(Date.now());
				this.campaignEditorState.setUserSearchLoading(false);
			}),
		);
	}

	clearPreview(): void {
		this.campaignEditorState.resetPreviews();
	}

	createCampaign(request: CampaignCreateRequest): Observable<CampaignCreateResponse> {
		return this.campaignService.createCampaign(request);
	}
}
