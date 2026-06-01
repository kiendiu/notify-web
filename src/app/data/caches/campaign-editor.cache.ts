import { Inject, Injectable } from '@angular/core';
import { CACHE_ENGINE, CacheEngine } from '../../core/stores/cache/cache.engine';
import { TemplateDto, UsersSearchResponse } from '../../managements/dtos/campaign-editor.dto';

export const CAMPAIGN_EDITOR_SCOPE = 'campaign.editor.preview';
export const CAMPAIGN_EDITOR_TTL_MS = 5 * 60 * 1000;

@Injectable()
export class CampaignEditorCache {
	constructor(@Inject(CACHE_ENGINE) private readonly cacheEngine: CacheEngine) {}

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

	/**
	 * Peek templates without enforcing TTL freshness.
	 */
	peekTemplates(): { value: TemplateDto[]; fetchedAt: number } | null {
		const cache = this.cacheEngine.get<TemplateDto[]>(this.buildTemplatesKey());
		if (!cache) return null;
		return { value: cache.value, fetchedAt: cache.fetchedAt };
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

	/**
	 * Peek users cache without enforcing TTL freshness.
	 */
	peekUsers(
		keyword: string,
		page: number,
		size: number,
	): { value: UsersSearchResponse; fetchedAt: number } | null {
		const cache = this.cacheEngine.get<UsersSearchResponse>(
			this.buildUsersKey(keyword, page, size),
		);
		if (!cache) return null;
		return { value: cache.value, fetchedAt: cache.fetchedAt };
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

	/** Expose templates cache key for external callers. */
	buildTemplatesCacheKey(): string {
		return this.buildTemplatesKey();
	}

	/** Expose users cache key for external callers. */
	buildUsersCacheKey(keyword: string, page: number, size: number): string {
		return this.buildUsersKey(keyword, page, size);
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