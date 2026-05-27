export type WebSocketActionType = 'CREATE' | 'UPDATE' | 'UPDATE_CAMPAIGN_STATS';

export interface WebSocketEnvelope<TData> {
  action: WebSocketActionType | string;
  data: TData;
}
