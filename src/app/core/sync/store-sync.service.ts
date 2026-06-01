import { Injectable, OnDestroy, inject } from '@angular/core';
import { Observable, Subject, filter, fromEvent, map, merge } from 'rxjs';
import { Action } from '@ngrx/store';

export interface StoreSyncEnvelope {
  sourceId: string;
  action: Action & { meta?: { sourceId?: string } };
  timestamp: number;
}

@Injectable()
export class StoreSyncService implements OnDestroy {
  private readonly channelName = 'kien-notify-web-store-sync';
  private readonly sourceId = crypto.randomUUID();
  private readonly messagesSubject = new Subject<StoreSyncEnvelope>();
  private readonly broadcastChannel: BroadcastChannel | null =
    typeof window !== 'undefined' && 'BroadcastChannel' in window
      ? new BroadcastChannel(this.channelName)
      : null;

  readonly messages$: Observable<StoreSyncEnvelope> = this.messagesSubject.asObservable();

  constructor() {
    if (this.broadcastChannel) {
      this.broadcastChannel.onmessage = (event) => {
        const envelope = event.data as StoreSyncEnvelope;
        if (this.isRemoteEnvelope(envelope)) {
          this.messagesSubject.next(envelope);
        }
      };
    }

    if (typeof window !== 'undefined') {
      fromEvent<StorageEvent>(window, 'storage')
        .pipe(
          filter((event) => event.key === this.channelName && Boolean(event.newValue)),
          map((event) => event.newValue as string),
          map((rawValue) => this.safeParse(rawValue)),
          filter((envelope): envelope is StoreSyncEnvelope => Boolean(envelope && this.isRemoteEnvelope(envelope))),
        )
        .subscribe((envelope) => this.messagesSubject.next(envelope));
    }
  }

  publish(action: Action): void {
    const envelope: StoreSyncEnvelope = {
      sourceId: this.sourceId,
      action: {
        ...action,
        meta: {
          ...(action as Action & { meta?: { sourceId?: string } }).meta,
          sourceId: this.sourceId,
        },
      },
      timestamp: Date.now(),
    };

    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage(envelope);
    }

    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(this.channelName, JSON.stringify(envelope));
      } catch {
        // ignore storage failures
      }
    }
  }

  ngOnDestroy(): void {
    this.broadcastChannel?.close();
    this.messagesSubject.complete();
  }

  private safeParse(rawValue: string): StoreSyncEnvelope | null {
    try {
      return JSON.parse(rawValue) as StoreSyncEnvelope;
    } catch {
      return null;
    }
  }

  private isRemoteEnvelope(envelope: StoreSyncEnvelope | null): envelope is StoreSyncEnvelope {
    return Boolean(envelope && envelope.sourceId !== this.sourceId && envelope.action);
  }
}
