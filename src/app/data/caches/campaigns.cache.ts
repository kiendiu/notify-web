import { Inject, Injectable } from '@angular/core';
import { CACHE_ENGINE, CacheEngine } from '../../core/stores/cache/cache.engine';
import { CampaignSearchResponse } from '../../managements/dtos/campaigns.dto';
import { CampaignSearchFilters } from '../../managements/params/campaigns.params';

export const CAMPAIGNS_SCOPE = 'campaigns.list';
export const CAMPAIGNS_TTL_MS = 60 * 1000; // 1 minute

export interface CampaignsCacheRecord<T> {
  value: T;
  fetchedAt: number;
}

@Injectable()
export class CampaignsCache {
  constructor(@Inject(CACHE_ENGINE) private readonly cacheEngine: CacheEngine) {}

  getCampaigns(filters: CampaignSearchFilters): CampaignsCacheRecord<CampaignSearchResponse> | null {
    const cache = this.cacheEngine.get<CampaignSearchResponse>(this.buildCampaignsCacheKey(filters));

    if (!this.cacheEngine.isFresh(cache, CAMPAIGNS_TTL_MS)) {
      return null;
    }

    return {
      value: cache!.value,
      fetchedAt: cache!.fetchedAt,
    };
  }

  /**
   * Peek cached campaigns record without enforcing TTL freshness.
   * Useful for stale-while-revalidate flows where we want to show stale data
   * immediately and refresh in background.
   */
  peekCampaigns(filters: CampaignSearchFilters): CampaignsCacheRecord<CampaignSearchResponse> | null {
    const cache = this.cacheEngine.get<CampaignSearchResponse>(this.buildCampaignsCacheKey(filters));
    if (!cache) return null;

    return {
      value: cache.value,
      fetchedAt: cache.fetchedAt,
    };
  }

  setCampaigns(filters: CampaignSearchFilters, response: CampaignSearchResponse): void {
    this.cacheEngine.set(this.buildCampaignsCacheKey(filters), response);
  }

  clearCampaigns(): void {
    this.cacheEngine.clearByPrefix(CAMPAIGNS_SCOPE);
  }

  buildCampaignsCacheKey(filters: CampaignSearchFilters): string {
    return `${CAMPAIGNS_SCOPE}:${stableStringify({
      campaignName: filters.campaignName.trim(),
      page: filters.page,
      size: filters.size,
      sortDirection: filters.sortDirection,
      status: filters.status,
    })}`;
  }
}

function stableStringify(obj: Record<string, unknown>): string {
  const sorted = Object.keys(obj)
    .sort()
    .reduce<Record<string, unknown>>((acc, key) => {
      acc[key] = obj[key];
      return acc;
    }, {});
  return JSON.stringify(sorted);
}