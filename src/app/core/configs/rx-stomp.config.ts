import { isDevMode } from '@angular/core';
import { RxStompConfig } from '@stomp/rx-stomp';
import SockJS from 'sockjs-client';

export const rxStompConfig: RxStompConfig = {
  webSocketFactory: () => new SockJS('http://localhost:8087/ws-notification'),
  heartbeatIncoming: 0,
  heartbeatOutgoing: 20000,
  reconnectDelay: 5000,
  debug: (message: string): void => {
    if (isDevMode()) {
      console.log('[RxStomp]', new Date().toISOString(), message);
    }
  },
};