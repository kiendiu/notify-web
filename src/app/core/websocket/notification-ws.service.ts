import { Injectable, OnDestroy } from '@angular/core';
import { RxStomp } from '@stomp/rx-stomp';
import { Observable, filter, map, share } from 'rxjs';
import { rxStompConfig } from '../configs/rx-stomp.config';
import {
  ActivitySocketEvent,
  CampaignLegacySocketEvent,
  CampaignSocketEvent,
  NotificationSocketEvent,
} from './websocket.models';
import { WS_TOPICS } from './websocket-topics.constants';

@Injectable({ providedIn: 'root' })
export class NotificationWsService implements OnDestroy {
  private readonly rxStomp = new RxStomp();
  private hasActivated = false;

  constructor() {
    this.rxStomp.configure(rxStompConfig);
  }

  watchCampaigns(): Observable<CampaignSocketEvent | CampaignLegacySocketEvent> {
    this.activateOnce();
    return this.rxStomp.watch(WS_TOPICS.CAMPAIGNS).pipe(
      map((message) => this.parseCampaignMessage(message.body)),
      filter((event): event is CampaignSocketEvent | CampaignLegacySocketEvent => event !== null),
      share(),
    );
  }

  watchNotifications(): Observable<NotificationSocketEvent> {
    this.activateOnce();
    return this.rxStomp.watch(WS_TOPICS.NOTIFICATIONS).pipe(
      map((message) => this.parseJsonMessage<NotificationSocketEvent>(message.body)),
      filter((event): event is NotificationSocketEvent => event !== null),
      share(),
    );
  }

  watchActivities(): Observable<ActivitySocketEvent> {
    this.activateOnce();
    return this.rxStomp.watch(WS_TOPICS.ACTIVITIES).pipe(
      map((message) => this.parseJsonMessage<ActivitySocketEvent>(message.body)),
      filter((event): event is ActivitySocketEvent => event !== null),
      share(),
    );
  }

  ngOnDestroy(): void {
    if (this.hasActivated) {
      this.rxStomp.deactivate();
      this.hasActivated = false;
    }
  }

  private activateOnce(): void {
    if (this.hasActivated) {
      return;
    }
    this.rxStomp.activate();
    this.hasActivated = true;
  }

  private parseJsonMessage<T>(rawBody: string): T | null {
    try {
      return JSON.parse(rawBody) as T;
    } catch {
      return null;
    }
  }

  private parseCampaignMessage(rawBody: string): CampaignSocketEvent | CampaignLegacySocketEvent | null {
    const jsonEvent = this.parseJsonMessage<CampaignSocketEvent>(rawBody);
    if (jsonEvent) {
      return jsonEvent;
    }

    const parts = rawBody.split(':');
    if (parts.length !== 2) {
      return null;
    }

    const campaignId = parts[0]?.trim();
    const status = parts[1]?.trim();
    if (!campaignId || !status) {
      return null;
    }

    return { campaignId, status };
  }
}
