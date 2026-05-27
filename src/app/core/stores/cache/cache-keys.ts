import { CampaignNotificationFilters } from '../../../managements/models/notifications.model';
import { CampaignSearchFilters } from '../../../managements/models/campaigns.model';

export const CacheScopes = {
  previewTemplates: 'preview.templates',
  previewUsers: 'preview.users',
  campaigns: 'campaigns.list',
  notifications: 'notifications.list',
  activities: 'activities.recent',
} as const;

export function buildPreviewUsersParams(keyword: string, page: number, size: number) {
  return { keyword: keyword.trim().toLowerCase(), page, size };
}

export function buildCampaignsParams(filters: CampaignSearchFilters) {
  return {
    keyword: filters.campaignName.trim(),
    page: filters.page,
    size: filters.size,
    sortDirection: filters.sortDirection,
    status: filters.status,
  };
}

export function buildNotificationsParams(campaignId: string | number, filters: CampaignNotificationFilters) {
  return {
    campaignId: String(campaignId),
    channel: filters.channel ?? '',
    keyWord: filters.keyWord ?? '',
    page: filters.page,
    size: filters.size,
    status: filters.status ?? '',
  };
}