import { ActivitySocketEvent } from '../../../core/websocket/websocket.models';

export interface ActivityState {
  items: ActivitySocketEvent[];
  loading: boolean;
  loaded: boolean;
  lastFetched: number | null;
  errorMessage: string | null;
}

export const initialActivityState: ActivityState = {
  items: [],
  loading: false,
  loaded: false,
  lastFetched: null,
  errorMessage: null,
};
