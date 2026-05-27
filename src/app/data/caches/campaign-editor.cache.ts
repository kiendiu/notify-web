export const CAMPAIGN_EDITOR_SCOPE = 'campaign.editor.preview';
export const CAMPAIGN_EDITOR_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function buildPreviewTemplatesCacheKey(): string {
  return `${CAMPAIGN_EDITOR_SCOPE}:templates`;
}

export function buildPreviewUsersCacheKey(
  keyword: string,
  page: number,
  size: number,
): string {
  return `${CAMPAIGN_EDITOR_SCOPE}:users:${stableStringify({
    keyword: keyword.trim().toLowerCase(),
    page,
    size,
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