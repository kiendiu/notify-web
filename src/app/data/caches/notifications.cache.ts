import { Inject, Injectable } from '@angular/core';
import { CACHE_ENGINE, CacheEngine } from '../../core/stores/cache/cache.engine';
import { CampaignNotificationFilters } from '../../managements/params/notifications.params';
import { CampaignNotificationSearchResponse } from '../../managements/dtos/notifications.dto';

export const NOTIFICATIONS_SCOPE = 'notifications.list';
export const NOTIFICATIONS_TTL_MS = 30 * 1000; // 30 seconds

@Injectable()
export class NotificationsCache {
  constructor(@Inject(CACHE_ENGINE) private readonly cacheEngine: CacheEngine) {}

  getCampaignNotifications(
    campaignId: string | number,
    filters: CampaignNotificationFilters,
  ): CampaignNotificationSearchResponse | null {
    const cache = this.cacheEngine.get<CampaignNotificationSearchResponse>(this.buildNotificationsCacheKey(campaignId, filters));

    if (!this.cacheEngine.isFresh(cache, NOTIFICATIONS_TTL_MS)) {
      return null;
    }

    return cache!.value;
  }

  /**
   * Peek campaign notifications without enforcing TTL freshness.
   */
  peekCampaignNotifications(
    campaignId: string | number,
    filters: CampaignNotificationFilters,
  ): { value: CampaignNotificationSearchResponse; fetchedAt: number } | null {
    const cache = this.cacheEngine.get<CampaignNotificationSearchResponse>(this.buildNotificationsCacheKey(campaignId, filters));
    if (!cache) return null;
    return { value: cache.value, fetchedAt: cache.fetchedAt };
  }

  setCampaignNotifications(
    campaignId: string | number,
    filters: CampaignNotificationFilters,
    response: CampaignNotificationSearchResponse,
  ): void {
    this.cacheEngine.set(this.buildNotificationsCacheKey(campaignId, filters), response);
  }

  invalidateCampaignNotifications(
    campaignId: string | number,
    filters: CampaignNotificationFilters,
  ): void {
    this.cacheEngine.remove(this.buildNotificationsCacheKey(campaignId, filters));
  }

  buildNotificationsCacheKey(
    campaignId: string | number,
    filters: CampaignNotificationFilters,
  ): string {
    return `${NOTIFICATIONS_SCOPE}:${stableStringify({
      campaignId: String(campaignId),
      channel: filters.channel ?? '',
      keyWord: filters.keyWord ?? '',
      page: filters.page,
      size: filters.size,
      status: filters.status ?? '',
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