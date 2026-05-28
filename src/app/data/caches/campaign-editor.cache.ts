import { Injectable, inject } from '@angular/core';
import { CACHE_ENGINE } from '../../core/stores/cache/cache.engine';
import { TemplateDto, UsersSearchResponse } from '../../managements/states/campaign-editor.state';

export const CAMPAIGN_EDITOR_SCOPE = 'campaign.editor.preview';
export const CAMPAIGN_EDITOR_TTL_MS = 5 * 60 * 1000;

@Injectable({ providedIn: 'root' })
export class CampaignEditorCache {
	private readonly cacheEngine = inject(CACHE_ENGINE);

	getTemplates(): TemplateDto[] | null {
		const cache = this.cacheEngine.get<TemplateDto[]>(
			this.buildTemplatesKey(),
		);

		if ( 
			!this.cacheEngine.isFresh(
				cache,
				CAMPAIGN_EDITOR_TTL_MS,
			)
		) {
			return null;
		}

		return cache?.value ?? null;
	}

	setTemplates( templates: TemplateDto[] ): void {
		this.cacheEngine.set(
			this.buildTemplatesKey(),
			templates,
		);
	}

	getUsers(
		keyword: string,
		page: number,
		size: number,
	): UsersSearchResponse | null {
		const cache = this.cacheEngine.get<UsersSearchResponse>(
				this.buildUsersKey(
					keyword,
					page,
					size,
				),
			);

		if (
			!this.cacheEngine.isFresh(
				cache,
				CAMPAIGN_EDITOR_TTL_MS,
			)
		) {
			return null;
		}

		return cache?.value ?? null;
	}

	setUsers(
		keyword: string,
		page: number,
		size: number,
		response: UsersSearchResponse,
	): void {
		this.cacheEngine.set(
			this.buildUsersKey(
				keyword,
				page,
				size,
			),
			response,
		);
	}

	private buildTemplatesKey(): string {
		return `${CAMPAIGN_EDITOR_SCOPE}:templates`;
	}

	private buildUsersKey(
		keyword: string,
		page: number,
		size: number,
	): string {
		return `${CAMPAIGN_EDITOR_SCOPE}:users:${this.stableStringify(
			{
				keyword:
					keyword
						.trim()
						.toLowerCase(),
				page,
				size,
			},
		)}`;
	}

	private stableStringify(
		obj: Record<string, unknown>,
	): string {
		const sorted = Object.keys(obj)
			.sort()
			.reduce<Record<string, unknown>>(
				(acc, key) => {
					acc[key] = obj[key];
					return acc;
				},
				{},
			);

		return JSON.stringify(sorted);
	}
}