import { CampaignNotificationFilters } from '../../management/models/notification.model';
import { CampaignSearchFilters } from '../../management/models/campaign.model';

export const CacheScopes = {
  previewTemplates: 'preview.templates',
  previewUsers: 'preview.users',
  campaigns: 'campaigns.list',
  notifications: 'notifications.list',
  activities: 'activities.recent',
} as const;

export function buildPreviewUsersCacheKey(keyword: string, page: number, size: number): string {
  return `keyword=${normalizeKeyword(keyword)}|page=${page}|size=${size}`;
}

export function buildCampaignsCacheKey(filters: CampaignSearchFilters): string {
  return buildKey({
    campaignName: filters.campaignName.trim(),
    page: filters.page,
    size: filters.size,
    sortDirection: filters.sortDirection,
    status: filters.status,
  });
}

export function buildNotificationsCacheKey(campaignId: string | number, filters: CampaignNotificationFilters): string {
  return buildKey({
    campaignId: String(campaignId),
    channel: filters.channel ?? '',
    keyWord: filters.keyWord ?? '',
    page: filters.page,
    size: filters.size,
    status: filters.status ?? '',
  });
}

function buildKey(value: Record<string, string | number>): string {
  return Object.keys(value)
    .sort()
    .map((key) => `${key}=${value[key]}`)
    .join('|');
}

function normalizeKeyword(keyword: string): string {
  return keyword.trim().toLowerCase();
}
