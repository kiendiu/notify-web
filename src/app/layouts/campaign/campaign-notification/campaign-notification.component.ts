import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { debounceTime } from 'rxjs';
import { SearchService } from '../../../services/search.service';
import { NotificationService } from '../../../services/notification.service';
import { CampaignSummary } from '../../../management/models/campaign.model';
import {
  CampaignNotificationFilters,
  CampaignNotificationPage,
  CampaignNotificationSummary,
  NotificationDeviceDetail,
  defaultNotificationFilters,
  defaultNotificationPage,
  normalizeNotificationDetails,
  normalizeNotificationPage,
} from '../../../management/models/notification.model';

@Component({
  selector: 'app-campaign-notification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './campaign-notification.html',
  styleUrl: './campaign-notification.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampaignNotificationComponent {
  //dependency injections
  private readonly notificationService = inject(NotificationService);
  private readonly searchService = inject(SearchService);

  //inputs
  readonly campaign = input<CampaignSummary | null>(null);
  readonly onBack = input<(() => void) | null>(null);

  //filter state
  readonly notificationFilters = signal<CampaignNotificationFilters>(defaultNotificationFilters);

  //list state
  readonly notificationItems = signal<CampaignNotificationSummary[]>([]);
  readonly notificationPage = signal<CampaignNotificationPage>(defaultNotificationPage);
  readonly notificationLoading = signal(false);
  readonly notificationErrorMessage = signal<string | null>(null);

  //detail modal state
  readonly selectedNotification = signal<CampaignNotificationSummary | null>(null);
  readonly notificationDetails = signal<NotificationDeviceDetail[]>([]);
  readonly notificationDetailsLoading = signal(false);
  readonly notificationDetailsErrorMessage = signal<string | null>(null);
  readonly showNotificationDetailsModal = signal(false);

  //computed state
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
    effect(() => {
      const campaign = this.campaign();
      if (!campaign) {
        this.resetNotificationState();
        return;
      }
      this.resetNotificationState();
      this.loadNotifications(0, {
        ...defaultNotificationFilters,
        size: defaultNotificationFilters.size,
      });
    });
    this.searchService
      .getSearch()
      .pipe(debounceTime(250))
      .subscribe((keyword) => {
        if (keyword == null) { return; }
        if (!this.campaign()) { return; }
        const nextFilters = {
          ...this.notificationFilters(),
          keyWord: keyword,
          page: 0,
        };
        this.notificationFilters.set(nextFilters);
        this.loadNotifications(0, nextFilters);
      });
  }

  //list methods

  reloadSelectedCampaignNotifications(): void {
    if (!this.campaign()) { return; }
    this.resetNotificationState();
    this.loadNotifications(0, this.notificationFilters());
  }

  goToNotificationPage(page: number): void {
    const currentPage = this.notificationPage();
    if (page < 0 || page >= currentPage.totalPages || page === currentPage.number) {
      return;
    }
    this.loadNotifications(page, this.notificationFilters());
  }

  //filter update methods
  updateNotificationChannel(channel: string): void {
    if (!this.campaign()) { return; }
    const nextFilters = {
      ...this.notificationFilters(),
      channel: this.normalizeNotificationChannel(channel),
      page: 0,
    };
    this.notificationFilters.set(nextFilters);
    this.loadNotifications(0, nextFilters);
  }

  updateNotificationStatus(status: string): void {
    if (!this.campaign()) { return; }
    const nextFilters = {
      ...this.notificationFilters(),
      status: this.normalizeNotificationStatus(status),
      page: 0,
    };
    this.notificationFilters.set(nextFilters);
    this.loadNotifications(0, nextFilters);
  }

  //detail modal methods
  openNotificationDetails(notification: CampaignNotificationSummary): void {
    this.selectedNotification.set(notification);
    this.notificationDetails.set([]);
    this.notificationDetailsErrorMessage.set(null);
    this.notificationDetailsLoading.set(true);
    this.showNotificationDetailsModal.set(true);
    this.notificationService.getNotificationDetails(notification.id).subscribe({
      next: (response) => {
        this.notificationDetails.set(normalizeNotificationDetails(response));
        this.notificationDetailsLoading.set(false);
      },
      error: () => {
        this.notificationDetailsLoading.set(false);
        this.notificationDetailsErrorMessage.set(
          'Không thể tải chi tiết thiết bị. Vui lòng thử lại.',
        );
      },
    });
  }

  closeNotificationDetailsModal(): void {
    this.showNotificationDetailsModal.set(false);
    this.selectedNotification.set(null);
    this.notificationDetails.set([]);
    this.notificationDetailsErrorMessage.set(null);
    this.notificationDetailsLoading.set(false);
  }

  //navigation methods
  emitBack(): void { this.onBack()?.(); }

  trackByNotificationId(_: number, notification: CampaignNotificationSummary): number {
    return notification.id;
  }
  trackByDeviceDetailId(_: number, detail: NotificationDeviceDetail): number {
    return detail.id;
  }

  //format methods

  formatDate(value: string | null | undefined): string {
    if (!value) { return '-'; }
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
      case 'SENT': return 'Đã gửi';
      case 'PENDING': return 'Đang chờ';
      case 'FAILED': return 'Thất bại';
      default: return status;
    }
  }

  getDisplayChannel(channel: string): string {
    const channels = this.getChannelValues(channel);
    if (channels.length === 0) { return '-';}
    return channels
      .map((value) => {
        switch (value) {
          case 'PUSH': return 'Push';
          case 'EMAIL': return 'Email';
          case 'SMS': return 'Message';
          default: return value;
        }
      }).join(', ');
  }

  getNotificationDestination(detail: NotificationDeviceDetail): string {
    return detail.address ?? detail.target ?? '-';
  }

  getNotificationDeviceCount(notification: CampaignNotificationSummary): number {
    return notification.count ?? notification.Count ?? 0;
  }

  getNotificationRetryText(detail: NotificationDeviceDetail): string {
    return detail.retryCount.toString();
  }

  getNotificationStatusText(status: string): string {
    return this.getDisplayStatus(status);
  }

  //ui helper methods
  channelIcon(channel: string): string {
    const channels = this.getChannelValues(channel);
    if (channels.length > 1) { return 'fa-layer-group'; }
    if (channels.length === 0) { return 'fa-bullhorn'; }
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
      case 'SENT': return '#10b981';
      case 'FAILED': return '#ef4444';
      case 'PENDING': return '#f59e0b';
      default: return '#cbd5e1';
    }
  }

  getStatusTextStyleColor(status: string): string {
    const normalized = status.toUpperCase();
    switch (normalized) {
      case 'SENT': return '#047857';
      case 'FAILED': return '#dc2626';
      case 'PENDING': return '#b45309';
      default: return '#475569';
    }
  }

  //data methods

  private loadNotifications(page: number, filtersOverride?: CampaignNotificationFilters): void {
    const campaign = this.campaign();
    if (!campaign) {return;}
    const filters = filtersOverride ?? this.notificationFilters();
    this.notificationLoading.set(true);
    this.notificationErrorMessage.set(null);
    this.notificationService
      .getCampaignNotifications(campaign.id, {
        ...filters,
        page,
      })
      .subscribe({
        next: (response) => {
          const normalized = normalizeNotificationPage(response);
          this.notificationItems.set(normalized.items);
          this.notificationPage.set(normalized);
          this.notificationFilters.set({
            ...filters,
            page: normalized.number,
            size: normalized.size,
          });
          this.notificationLoading.set(false);
        },
        error: () => {
          this.notificationLoading.set(false);
          this.notificationErrorMessage.set('Không thể tải danh sách thông báo. Vui lòng thử lại.');
          if (page === 0) {
            this.notificationPage.set(defaultNotificationPage);
          }
        },
      });
  }

  //normalization methods
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

  private resetNotificationState(): void {
    this.notificationFilters.set(defaultNotificationFilters);
    this.notificationItems.set([]);
    this.notificationPage.set(defaultNotificationPage);
    this.notificationLoading.set(false);
    this.notificationErrorMessage.set(null);
    this.selectedNotification.set(null);
    this.notificationDetails.set([]);
    this.notificationDetailsLoading.set(false);
    this.notificationDetailsErrorMessage.set(null);
    this.showNotificationDetailsModal.set(false);
  }

  //helper methods
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
    if (!channel) { return []; }
    return channel
      .split(',')
      .map((item) => item.trim().toUpperCase())
      .filter((item) => item.length > 0);
  }
}
// import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
// import { debounceTime } from 'rxjs';
// import { SearchService } from '../../../services/search.service';
// import { CommonModule } from '@angular/common';
// import { NotificationService } from '../../../services/notification.service';
// import { CampaignSummary } from '../../../management/models/campaign.model';
// import {
//   CampaignNotificationFilters,
//   CampaignNotificationPage,
//   CampaignNotificationSummary,
//   NotificationDeviceDetail,
//   defaultNotificationFilters,
//   defaultNotificationPage,
//   normalizeNotificationDetails,
//   normalizeNotificationPage,
// } from '../../../management/models/notification.model';

// @Component({
//   selector: 'app-campaign-notification',
//   standalone: true,
//   imports: [CommonModule],
//   templateUrl: './campaign-notification.html',
//   styleUrl: './campaign-notification.scss',
//   changeDetection: ChangeDetectionStrategy.OnPush,
// })
// export class CampaignNotificationComponent {
//   private readonly notificationService = inject(NotificationService);

//   readonly campaign = input<CampaignSummary | null>(null);
//   readonly onBack = input<(() => void) | null>(null);
//   private readonly searchService = inject(SearchService);

//   readonly notificationFilters = signal<CampaignNotificationFilters>(defaultNotificationFilters);
//   readonly notificationItems = signal<CampaignNotificationSummary[]>([]);
//   readonly notificationPage = signal<CampaignNotificationPage>(defaultNotificationPage);
//   readonly notificationLoading = signal(false);
//   readonly notificationErrorMessage = signal<string | null>(null);
//   readonly selectedNotification = signal<CampaignNotificationSummary | null>(null);
//   readonly notificationDetails = signal<NotificationDeviceDetail[]>([]);
//   readonly notificationDetailsLoading = signal(false);
//   readonly notificationDetailsErrorMessage = signal<string | null>(null);
//   readonly showNotificationDetailsModal = signal(false);
//   readonly pageNumbers = computed(() => this.buildPageNumbers(this.notificationPage().totalPages, this.notificationPage().number));
//   readonly hasNoNotifications = computed(() => !this.notificationLoading() && this.notificationItems().length === 0);
//   readonly canGoPreviousPage = computed(() => !this.notificationPage().first);
//   readonly canGoNextPage = computed(() => !this.notificationPage().last);

//   constructor() {
//     effect(() => {
//       const campaign = this.campaign();

//       if (!campaign) {
//         this.resetNotificationState();
//         return;
//       }

//       this.resetNotificationState();
//       this.loadNotifications(0, {
//         ...defaultNotificationFilters,
//         size: defaultNotificationFilters.size,
//       });
//     });

//     this.searchService.getSearch().pipe(debounceTime(250)).subscribe((keyword) => {
//       if (keyword == null) {
//         return;
//       }

//       if (this.campaign()) {
//         const nextFilters = {
//           ...this.notificationFilters(),
//           keyWord: keyword,
//           page: 0,
//         } as typeof this.notificationFilters extends () => infer T ? T : never;

//         this.notificationFilters.set(nextFilters as any);
//         this.loadNotifications(0, nextFilters as any);
//       }
//     });
//   }

//   readonly notificationCount = computed(() => this.notificationPage().totalElements);

//   reloadSelectedCampaignNotifications(): void {
//     if (!this.campaign()) {
//       return;
//     }

//     this.resetNotificationState();
//     this.loadNotifications(0, this.notificationFilters());
//   }

//   updateNotificationChannel(channel: string): void {
//     if (!this.campaign()) {
//       return;
//     }

//     const nextFilters = {
//       ...this.notificationFilters(),
//       channel: this.normalizeNotificationChannel(channel),
//       page: 0,
//     };

//     this.notificationFilters.set(nextFilters);
//     this.loadNotifications(0, nextFilters);
//   }

//   updateNotificationStatus(status: string): void {
//     if (!this.campaign()) {
//       return;
//     }

//     const nextFilters = {
//       ...this.notificationFilters(),
//       status: this.normalizeNotificationStatus(status),
//       page: 0,
//     };

//     this.notificationFilters.set(nextFilters);
//     this.loadNotifications(0, nextFilters);
//   }

//   goToNotificationPage(page: number): void {
//     const currentPage = this.notificationPage();

//     if (page < 0 || page >= currentPage.totalPages || page === currentPage.number) {
//       return;
//     }

//     this.loadNotifications(page, this.notificationFilters());
//   }

//   openNotificationDetails(notification: CampaignNotificationSummary): void {
//     this.selectedNotification.set(notification);
//     this.notificationDetails.set([]);
//     this.notificationDetailsErrorMessage.set(null);
//     this.notificationDetailsLoading.set(true);
//     this.showNotificationDetailsModal.set(true);

//     this.notificationService.getNotificationDetails(notification.id).subscribe({
//       next: (response) => {
//         this.notificationDetails.set(normalizeNotificationDetails(response));
//         this.notificationDetailsLoading.set(false);
//       },
//       error: () => {
//         this.notificationDetailsLoading.set(false);
//         this.notificationDetailsErrorMessage.set('Không thể tải chi tiết thiết bị. Vui lòng thử lại.');
//       },
//     });
//   }

//   closeNotificationDetailsModal(): void {
//     this.showNotificationDetailsModal.set(false);
//     this.selectedNotification.set(null);
//     this.notificationDetails.set([]);
//     this.notificationDetailsErrorMessage.set(null);
//     this.notificationDetailsLoading.set(false);
//   }

//   emitBack(): void {
//     this.onBack()?.();
//   }

//   trackByNotificationId(_: number, notification: CampaignNotificationSummary): number {
//     return notification.id;
//   }

//   trackByDeviceDetailId(_: number, detail: NotificationDeviceDetail): number {
//     return detail.id;
//   }

//   formatDate(value: string | null | undefined): string {
//     if (!value) {
//       return '-';
//     }

//     return new Intl.DateTimeFormat('vi-VN', {
//       day: '2-digit',
//       month: '2-digit',
//       year: 'numeric',
//       hour: '2-digit',
//       minute: '2-digit',
//     }).format(new Date(value));
//   }

//   channelIcon(channel: string): string {
//     const channels = this.getChannelValues(channel);

//     if (channels.length > 1) {
//       return 'fa-layer-group';
//     }

//     if (channels.length === 0) {
//       return 'fa-bullhorn';
//     }

//     switch (channels[0]) {
//       case 'PUSH':
//         return 'fa-mobile-alt';
//       case 'EMAIL':
//         return 'fa-envelope';
//       case 'SMS':
//         return 'fa-comment-dots';
//       default:
//         return 'fa-bullhorn';
//     }
//   }

//   getDisplayStatus(status: string): string {
//     const normalized = status.toUpperCase();
//     switch (normalized) {
//       case 'SENT':
//         return 'Đã gửi';
//       case 'PENDING':
//         return 'Đang chờ';
//       case 'FAILED':
//         return 'Thất bại';
//       default:
//         return status;
//     }
//   }

//   getDisplayChannel(channel: string): string {
//     const channels = this.getChannelValues(channel);

//     if (channels.length === 0) {
//       return '-';
//     }

//     return channels
//       .map((value) => {
//         switch (value) {
//           case 'PUSH':
//             return 'Push';
//           case 'EMAIL':
//             return 'Email';
//           case 'SMS':
//             return 'Message';
//           default:
//             return value;
//         }
//       })
//       .join(', ');
//   }

//   getChannelBadgeClass(channel: string): string {
//     const channels = this.getChannelValues(channel);

//     if (channels.length > 1 || channels.length === 0) {
//       return 'default';
//     }

//     return channels[0].toLowerCase();
//   }

//   getStatusDotColor(status: string): string {
//     const normalized = status.toUpperCase();
//     switch (normalized) {
//       case 'SENT':
//         return '#10b981';
//       case 'FAILED':
//         return '#ef4444';
//       case 'PENDING':
//         return '#f59e0b';
//       default:
//         return '#cbd5e1';
//     }
//   }

//   getStatusTextStyleColor(status: string): string {
//     const normalized = status.toUpperCase();
//     switch (normalized) {
//       case 'SENT':
//         return '#047857';
//       case 'FAILED':
//         return '#dc2626';
//       case 'PENDING':
//         return '#b45309';
//       default:
//         return '#475569';
//     }
//   }

//   getNotificationDestination(detail: NotificationDeviceDetail): string {
//     return detail.address ?? detail.target ?? '-';
//   }

//   getNotificationDeviceCount(notification: CampaignNotificationSummary): number {
//     return notification.count ?? notification.Count ?? 0;
//   }

//   getNotificationRetryText(detail: NotificationDeviceDetail): string {
//     return detail.retryCount.toString();
//   }

//   getNotificationStatusText(status: string): string {
//     return this.getDisplayStatus(status);
//   }

//   private normalizeNotificationChannel(channel: string): CampaignNotificationFilters['channel'] {
//     const normalized = channel.toLowerCase();

//     if (normalized === 'push' || normalized === 'email' || normalized === 'sms') {
//       return normalized;
//     }

//     return '';
//   }

//   private normalizeNotificationStatus(status: string): CampaignNotificationFilters['status'] {
//     const normalized = status.toLowerCase();

//     if (normalized === 'sent' || normalized === 'pending' || normalized === 'failed') {
//       return normalized;
//     }

//     return '';
//   }

//   private resetNotificationState(): void {
//     this.notificationFilters.set(defaultNotificationFilters);
//     this.notificationItems.set([]);
//     this.notificationPage.set(defaultNotificationPage);
//     this.notificationLoading.set(false);
//     this.notificationErrorMessage.set(null);
//     this.selectedNotification.set(null);
//     this.notificationDetails.set([]);
//     this.notificationDetailsLoading.set(false);
//     this.notificationDetailsErrorMessage.set(null);
//     this.showNotificationDetailsModal.set(false);
//   }

//   private loadNotifications(page: number, filtersOverride?: CampaignNotificationFilters): void {
//     const campaign = this.campaign();
//     if (!campaign) {
//       return;
//     }

//     const filters = filtersOverride ?? this.notificationFilters();

//     this.notificationLoading.set(true);
//     this.notificationErrorMessage.set(null);

//     this.notificationService.getCampaignNotifications(campaign.id, {
//       ...filters,
//       page,
//     }).subscribe({
//       next: (response) => {
//         const normalized = normalizeNotificationPage(response);
//         this.notificationItems.set(normalized.items);
//         this.notificationPage.set(normalized);
//         this.notificationFilters.set({
//           ...filters,
//           page: normalized.number,
//           size: normalized.size,
//         });
//         this.notificationLoading.set(false);
//       },
//       error: () => {
//         this.notificationLoading.set(false);
//         this.notificationErrorMessage.set('Không thể tải danh sách thông báo. Vui lòng thử lại.');
//         if (page === 0) {
//           this.notificationPage.set(defaultNotificationPage);
//         }
//       },
//     });
//   }

//   private buildPageNumbers(totalPages: number, currentPage: number): number[] {
//     if (totalPages <= 1) {
//       return totalPages === 1 ? [0] : [];
//     }

//     const start = Math.max(0, currentPage - 1);
//     const end = Math.min(totalPages - 1, start + 2);
//     const pages: number[] = [];

//     for (let page = start; page <= end; page += 1) {
//       pages.push(page);
//     }

//     return pages;
//   }

//   private getChannelValues(channel: string): string[] {
//     if (!channel) {
//       return [];
//     }

//     return channel
//       .split(',')
//       .map((item) => item.trim().toUpperCase())
//       .filter((item) => item.length > 0);
//   }
// }
