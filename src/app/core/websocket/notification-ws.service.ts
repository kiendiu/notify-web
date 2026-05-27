import { Injectable, OnDestroy } from '@angular/core';
import { RxStomp } from '@stomp/rx-stomp';
import { Observable, filter, map, share, tap } from 'rxjs';
import { rxStompConfig } from '../configs/rx-stomp.config';
import {
  ActivitySocketEvent,
  CampaignLegacySocketEvent,
  CampaignSocketEvent,
  NotificationDeviceStatusUpdateEvent,
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
      tap((message) => console.info('[WS][CAMPAIGNS] raw ->', message.body)),
      map((message) => this.parseCampaignMessage(message.body)),
      tap((event) => console.info('[WS][CAMPAIGNS] parsed ->', event)),
      filter((event): event is CampaignSocketEvent | CampaignLegacySocketEvent => event !== null),
      share(),
    );
  }

  watchNotifications(): Observable<NotificationSocketEvent> {
    this.activateOnce();
    return this.rxStomp.watch(WS_TOPICS.NOTIFICATIONS).pipe(
      tap((message) => console.info('[WS][NOTIFICATIONS] raw ->', message.body)),
      map((message) => this.parseJsonMessage<NotificationSocketEvent>(message.body)),
      tap((event) => console.info('[WS][NOTIFICATIONS] parsed ->', event)),
      filter((event): event is NotificationSocketEvent => event !== null),
      share(),
    );
  }

  watchNotificationDeviceStatus(notificationId: string | number): Observable<NotificationDeviceStatusUpdateEvent> {
    this.activateOnce();
    return this.rxStomp.watch(WS_TOPICS.NOTIFICATION_DEVICE_STATUS(notificationId)).pipe(
      tap((message) => console.info(`[WS][NOTIFICATION_DEVICE_STATUS:${notificationId}] raw ->`, message.body)),
      map((message) => this.parseNotificationDeviceStatusMessage(message.body)),
      tap((event) => console.info(`[WS][NOTIFICATION_DEVICE_STATUS:${notificationId}] parsed ->`, event)),
      filter((event): event is NotificationDeviceStatusUpdateEvent => event !== null),
      share(),
    );
  }

  watchActivities(): Observable<ActivitySocketEvent> {
    this.activateOnce();
    return this.rxStomp.watch(WS_TOPICS.ACTIVITIES).pipe(
      tap((message) => console.info('[WS][ACTIVITIES] raw ->', message.body)),
      map((message) => this.parseJsonMessage<ActivitySocketEvent>(message.body)),
      tap((event) => console.info('[WS][ACTIVITIES] parsed ->', event)),
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
    console.info('[WS] activating websocket client');
    this.rxStomp.activate();
    this.hasActivated = true;
  }

  private parseJsonMessage<T>(rawBody: string): T | null {
    try {
      const parsed = JSON.parse(rawBody) as T;
      return parsed;
    } catch {
      console.warn('[WS] failed to parse JSON message:', rawBody);
      return null;
    }
  }

  private parseNotificationDeviceStatusMessage(rawBody: string): NotificationDeviceStatusUpdateEvent | null {
    const parsed = this.parseJsonMessage<unknown>(rawBody);
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    const envelope = parsed as { data?: unknown };
    const payload = envelope.data ?? parsed;
    if (!payload || typeof payload !== 'object') {
      return null;
    }

    const candidate = payload as Partial<NotificationDeviceStatusUpdateEvent>;
    if (!candidate.deviceId || !candidate.status) {
      return null;
    }

    return {
      event: candidate.event ?? 'DEVICE_STATUS_UPDATE',
      deviceId: candidate.deviceId,
      status: candidate.status,
      errorMessage: candidate.errorMessage ?? null,
      latestLogId: candidate.latestLogId ?? null,
    };
  }

  private parseCampaignMessage(rawBody: string): CampaignSocketEvent | CampaignLegacySocketEvent | null {
    const parts = rawBody.split(':');
    if (parts.length !== 2) {
      if (!rawBody.trim().startsWith('{')) {
        return null;
      }

      const jsonEvent = this.parseJsonMessage<CampaignSocketEvent>(rawBody);
      if (jsonEvent) {
        return jsonEvent;
      }

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
