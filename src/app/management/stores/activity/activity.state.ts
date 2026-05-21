import { ActivitySocketEvent } from '../../../core/websocket/websocket.models';

export interface ActivityState {
  items: ActivitySocketEvent[];
  loading: boolean;
  errorMessage: string | null;
}

export const initialActivityState: ActivityState = {
  items: [],
  loading: false,
  errorMessage: null,
};
