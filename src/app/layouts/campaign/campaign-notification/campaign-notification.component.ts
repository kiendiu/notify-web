import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { debounceTime } from 'rxjs';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { SearchService } from '../../../services/search.service';
import { NotificationService } from '../../../services/notification.service';
import { CampaignSummary } from '../../../management/models/campaign.model';
import {
  CampaignNotificationFilters,
  CampaignNotificationSummary,
  NotificationDeviceDetail,
  normalizeNotificationDetails,
} from '../../../management/models/notification.model';
import { NotificationDetailComponent } from './notification-detail.component';
import { initialNotificationState } from '../../../management/stores/notification/notification.state';
import * as NotificationActions from '../../../management/stores/notification/notification.actions';
import { selectNotificationState } from '../../../management/stores/notification/notification.selectors';

@Component({
  selector: 'app-campaign-notification',
  standalone: true,
  imports: [CommonModule, NotificationDetailComponent],
  templateUrl: './campaign-notification.html',
  styleUrl: './campaign-notification.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampaignNotificationComponent {
  private readonly store = inject(Store);
  private readonly destroyRef = inject(DestroyRef);
  private readonly notificationService = inject(NotificationService);
  private readonly searchService = inject(SearchService);

  readonly campaign = input<Pick<CampaignSummary, 'id'> | CampaignSummary | null>(null);
  readonly onBack = input<(() => void) | null>(null);

  readonly notificationState = toSignal(this.store.select(selectNotificationState), {
    initialValue: initialNotificationState,
  });

  readonly selectedNotification = signal<CampaignNotificationSummary | null>(null);
  readonly notificationDetails = signal<NotificationDeviceDetail[]>([]);
  readonly notificationDetailsLoading = signal(false);
  readonly notificationDetailsErrorMessage = signal<string | null>(null);
  readonly showNotificationDetailsPanel = signal(false);

  readonly notificationFilters = computed(() => this.notificationState().filters);
  readonly notificationItems = computed(() => this.notificationState().page.items);
  readonly notificationPage = computed(() => this.notificationState().page);
  readonly notificationLoading = computed(() => this.notificationState().loading);
  readonly notificationErrorMessage = computed(() => this.notificationState().errorMessage);
  readonly retryLoading = computed(() => this.notificationState().retryLoading);
  readonly retryError = computed(() => this.notificationState().retryErrorMessage);

  readonly notificationCount = computed(() => this.notificationPage().totalElements);
  readonly pageNumbers = computed(() =>
    this.buildPageNumbers(this.notificationPage().totalPages, this.notificationPage().number),
  );
  readonly hasNoNotifications = computed(
    () => !this.notificationLoading() && this.notificationItems().length === 0,
  );
  readonly canGoPreviousPage = computed(() => !this.notificationPage().first);
  readonly canGoNextPage = computed(() => !this.notificationPage().last);

  constructor() {
    this.store.dispatch(NotificationActions.connectNotificationRealtime());

    effect(() => {
      const campaign = this.campaign();
      if (!campaign) {
        this.store.dispatch(NotificationActions.clearNotificationState());
        this.closeNotificationDetailsPanel();
        return;
      }

      this.store.dispatch(
        NotificationActions.setActiveNotificationCampaign({ campaignId: String(campaign.id) }),
      );
      this.store.dispatch(NotificationActions.loadNotifications());
    });

    this.searchService
      .getSearch()
      .pipe(debounceTime(250), takeUntilDestroyed(this.destroyRef))
      .subscribe((keyword) => {
        if (!this.campaign()) {
          return;
        }

        this.store.dispatch(
          NotificationActions.setNotificationFilters({
            filters: {
              keyWord: keyword ?? '',
              page: 0,
            },
          }),
        );
        this.store.dispatch(NotificationActions.loadNotifications());
      });
  }

  reloadSelectedCampaignNotifications(): void {
    if (!this.campaign()) {
      return;
    }
    this.store.dispatch(NotificationActions.setNotificationPage({ page: 0 }));
    this.store.dispatch(NotificationActions.loadNotifications());
  }

  goToNotificationPage(page: number): void {
    const currentPage = this.notificationPage();
    if (page < 0 || page >= currentPage.totalPages || page === currentPage.number) {
      return;
    }
    this.store.dispatch(NotificationActions.setNotificationPage({ page }));
    this.store.dispatch(NotificationActions.loadNotifications());
  }

  updateNotificationChannel(channel: string): void {
    if (!this.campaign()) {
      return;
    }
    this.store.dispatch(
      NotificationActions.setNotificationFilters({
        filters: {
          channel: this.normalizeNotificationChannel(channel),
          page: 0,
        },
      }),
    );
    this.store.dispatch(NotificationActions.loadNotifications());
  }

  updateNotificationStatus(status: string): void {
    if (!this.campaign()) {
      return;
    }
    this.store.dispatch(
      NotificationActions.setNotificationFilters({
        filters: {
          status: this.normalizeNotificationStatus(status),
          page: 0,
        },
      }),
    );
    this.store.dispatch(NotificationActions.loadNotifications());
  }

  openNotificationDetails(notification: CampaignNotificationSummary): void {
    this.selectedNotification.set(notification);
    this.notificationDetails.set([]);
    this.notificationDetailsErrorMessage.set(null);
    this.notificationDetailsLoading.set(true);
    this.showNotificationDetailsPanel.set(true);

    this.notificationService
      .getNotificationDetails(notification.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.notificationDetails.set(normalizeNotificationDetails(response));
          this.notificationDetailsLoading.set(false);
        },
        error: () => {
          this.notificationDetailsLoading.set(false);
          this.notificationDetailsErrorMessage.set(
            'Kh�ng th? t?i chi ti?t thi?t b?. Vui l�ng th? l?i.',
          );
        },
      });
  }

  closeNotificationDetailsPanel(): void {
    this.showNotificationDetailsPanel.set(false);
    this.selectedNotification.set(null);
    this.notificationDetails.set([]);
    this.notificationDetailsErrorMessage.set(null);
    this.notificationDetailsLoading.set(false);
  }

  retryNotification(): void {
    const notification = this.selectedNotification();
    if (!notification) {
      return;
    }

    this.store.dispatch(NotificationActions.retryNotification({ notificationId: notification.id }));
  }

  retryNotificationFromTable(notification: CampaignNotificationSummary): void {
    this.store.dispatch(NotificationActions.retryNotification({ notificationId: notification.id }));
  }

  emitBack(): void {
    this.onBack()?.();
  }

  trackByNotificationId(_: number, notification: CampaignNotificationSummary): number {
    return notification.id;
  }

  formatDate(value: string | null | undefined): string {
    if (!value) {
      return '-';
    }
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  }

  getDisplayStatus(status: string): string {
    const normalized = status.toUpperCase();
    switch (normalized) {
      case 'SENT':
        return 'Đã gửi';
      case 'PENDING':
        return 'Đang chờ';
      case 'FAILED':
        return 'Thất bại';
      default:
        return status;
    }
  }

  getDisplayChannel(channel: string): string {
    const channels = this.getChannelValues(channel);
    if (channels.length === 0) {
      return '-';
    }
    return channels
      .map((value) => {
        switch (value) {
          case 'PUSH':
            return 'Push';
          case 'EMAIL':
            return 'Email';
          case 'SMS':
            return 'Message';
          default:
            return value;
        }
      })
      .join(', ');
  }

  getNotificationDeviceCount(notification: CampaignNotificationSummary): number {
    return notification.count ?? notification.Count ?? 0;
  }

  channelIcon(channel: string): string {
    const channels = this.getChannelValues(channel);
    if (channels.length > 1) {
      return 'fa-layer-group';
    }
    if (channels.length === 0) {
      return 'fa-bullhorn';
    }
    switch (channels[0]) {
      case 'PUSH':
        return 'fa-mobile-alt';
      case 'EMAIL':
        return 'fa-envelope';
      case 'SMS':
        return 'fa-comment-dots';
      default:
        return 'fa-bullhorn';
    }
  }

  getChannelBadgeClass(channel: string): string {
    const channels = this.getChannelValues(channel);
    if (channels.length > 1 || channels.length === 0) {
      return 'default';
    }
    return channels[0].toLowerCase();
  }

  getStatusDotColor(status: string): string {
    const normalized = status.toUpperCase();
    switch (normalized) {
      case 'SENT':
        return '#10b981';
      case 'FAILED':
        return '#ef4444';
      case 'PENDING':
        return '#f59e0b';
      default:
        return '#cbd5e1';
    }
  }

  getStatusTextStyleColor(status: string): string {
    const normalized = status.toUpperCase();
    switch (normalized) {
      case 'SENT':
        return '#047857';
      case 'FAILED':
        return '#dc2626';
      case 'PENDING':
        return '#b45309';
      default:
        return '#475569';
    }
  }

  isFailedNotification(status: string): boolean {
    return status.toUpperCase() === 'FAILED';
  }

  private normalizeNotificationChannel(channel: string): CampaignNotificationFilters['channel'] {
    const normalized = channel.toLowerCase();
    if (normalized === 'push' || normalized === 'email' || normalized === 'sms') {
      return normalized;
    }
    return '';
  }

  private normalizeNotificationStatus(status: string): CampaignNotificationFilters['status'] {
    const normalized = status.toLowerCase();
    if (normalized === 'sent' || normalized === 'pending' || normalized === 'failed') {
      return normalized;
    }
    return '';
  }

  private buildPageNumbers(totalPages: number, currentPage: number): number[] {
    if (totalPages <= 1) {
      return totalPages === 1 ? [0] : [];
    }
    const start = Math.max(0, currentPage - 1);
    const end = Math.min(totalPages - 1, start + 2);
    const pages: number[] = [];
    for (let page = start; page <= end; page += 1) {
      pages.push(page);
    }
    return pages;
  }

  private getChannelValues(channel: string): string[] {
    if (!channel) {
      return [];
    }
    return channel
      .split(',')
      .map((item) => item.trim().toUpperCase())
      .filter((item) => item.length > 0);
  }
}
