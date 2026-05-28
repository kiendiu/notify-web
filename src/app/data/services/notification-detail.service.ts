import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Endpoint } from '../../core/constants/endpoint';
import { NotificationDetailsResponse } from '../../managements/models/notifications.model';
import { API_ENGINE } from '../../core/stores/api/api.engine.interface';

@Injectable({ providedIn: 'root' })
export class NotificationDetailService {
  private readonly apiEngine = inject(API_ENGINE);

  getNotificationDetails(notificationId: string | number): Observable<NotificationDetailsResponse> {
    return this.apiEngine.get<NotificationDetailsResponse>(Endpoint.CAMPAIGNS.NOTIFICATION_DETAILS(notificationId));
  }

  retryNotificationDevice(logId: string | number): Observable<void> {
    return this.apiEngine.post<string>(
      Endpoint.CAMPAIGNS.DELIVERY_LOG_RETRY(logId),
      {},
      { responseType: 'text' },
    ).pipe(map(() => void 0));
  }
}
