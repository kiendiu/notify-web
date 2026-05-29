import { Inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Endpoint } from '../../core/constants/endpoint';
import { NotificationDetailsResponse } from '../../managements/dtos/notifications.dto';
import { API_ENGINE, ApiEngine } from '../../core/stores/api/api.engine.interface';

@Injectable()
export class NotificationDetailService {
  constructor(@Inject(API_ENGINE) private readonly apiEngine: ApiEngine) {}

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
