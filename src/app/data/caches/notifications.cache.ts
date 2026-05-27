import { CampaignNotificationFilters } from '../../managements/models/notifications.model';

export const NOTIFICATIONS_SCOPE = 'notifications.list';
export const NOTIFICATIONS_TTL_MS = 30 * 1000; // 30 seconds

export function buildNotificationsCacheKey(
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

function stableStringify(obj: Record<string, unknown>): string {
  const sorted = Object.keys(obj)
    .sort()
    .reduce<Record<string, unknown>>((acc, key) => {
      acc[key] = obj[key];
      return acc;
    }, {});
  return JSON.stringify(sorted);
}