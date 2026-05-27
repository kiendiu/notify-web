import { CampaignSearchFilters } from '../../managements/models/campaigns.model';

export const CAMPAIGNS_SCOPE = 'campaigns.list';
export const CAMPAIGNS_TTL_MS = 60 * 1000; // 1 minute

export function buildCampaignsCacheKey(filters: CampaignSearchFilters): string {
  return `${CAMPAIGNS_SCOPE}:${stableStringify({
    campaignName: filters.campaignName.trim(),
    page: filters.page,
    size: filters.size,
    sortDirection: filters.sortDirection,
    status: filters.status,
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