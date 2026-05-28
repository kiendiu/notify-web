import { Injectable, inject } from '@angular/core';
import { CACHE_ENGINE } from '../../core/stores/cache/cache.engine';
import { CampaignNotificationFilters, CampaignNotificationSearchResponse } from '../../managements/models/notifications.model';

export const NOTIFICATIONS_SCOPE = 'notifications.list';
export const NOTIFICATIONS_TTL_MS = 30 * 1000; // 30 seconds

@Injectable({ providedIn: 'root' })
export class NotificationsCache {
  private readonly cacheEngine = inject(CACHE_ENGINE);

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