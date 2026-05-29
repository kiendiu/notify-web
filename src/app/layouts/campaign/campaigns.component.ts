import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { debounceTime } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SearchService } from '../../data/services/search.service';
import { CampaignSummary, CampaignSortDirection, CampaignStatusFilter } from '../../managements/models/campaigns.model';
import { CampaignCreateResponse } from '../../managements/dtos/campaigns.dto';
import { normalizeCampaignPage } from '../../managements/mappers/campaigns.mapper';
import { CampaignsQuery } from '../../managements/queries/campaigns.query';
import { CampaignEditorQuery } from '../../managements/queries/campaign-editor.query';
import { CampaignsStateService, initialCampaignState } from '../../managements/states/campaigns.state';
import { CampaignEditorState } from '../../managements/states/campaign-editor.state';
import { CampaignEditorComponent } from './campaign-editor/campaign-editor.component';
import { NotificationsComponent } from './notifications/notifications.component';
import { NotificationsQuery } from '../../managements/queries/notifications.query';
import { NotificationsStateService } from '../../managements/states/notifications.state';
import { UiStateService } from '../../core/stores/state/ui-state.service';
import { NotificationService } from '../../data/services/notifications.service';
import { NotificationsCache } from '../../data/caches/notifications.cache';
import { NotificationWsService } from '../../core/websocket/notification-ws.service';
import { StoreSyncEnvelope, StoreSyncService } from '../../core/sync/store-sync.service';
import { CampaignEditorService } from '../../data/services/campaign-editor.service';
import { CampaignEditorCache } from '../../data/caches/campaign-editor.cache';
import { CampaignService } from '../../data/services/campaigns.service';
import { CampaignsCache } from '../../data/caches/campaigns.cache';
import { NotificationDetailQuery } from '../../managements/queries/notification-detail.query';
import { NotificationDetailStateService } from '../../managements/states/notification-detail.state';
import { NotificationDetailService } from '../../data/services/notification-detail.service';
import { NotificationDetailCache } from '../../data/caches/notification-detail.cache';
import { OptionCachePolicy } from '../../managements/policy/cache-policy';

const CAMPAIGNS_SYNC_RELOAD_ACTION = '[Campaigns] Reload List';

@Component({
	selector: 'app-campaigns',
	standalone: true,
	imports: [CommonModule],
	providers: [CampaignsQuery, CampaignsStateService, CampaignService, CampaignsCache, CampaignEditorService, CampaignEditorCache, CampaignEditorQuery, CampaignEditorState, NotificationsQuery, NotificationsStateService, NotificationService, NotificationsCache, NotificationWsService, StoreSyncService, UiStateService, NotificationDetailQuery, NotificationDetailStateService, NotificationDetailService, NotificationDetailCache],
	templateUrl: './campaigns.html',
	styleUrl: './campaigns.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampaignsComponent implements OnInit {
	constructor(
		private readonly destroyRef: DestroyRef,
		private readonly cdr: ChangeDetectorRef,
		private readonly campaignsQuery: CampaignsQuery,
		private readonly campaignEditorQuery: CampaignEditorQuery,
		private readonly campaignsState: CampaignsStateService,
		private readonly searchService: SearchService,
		private readonly websocket: NotificationWsService,
		private readonly storeSyncService: StoreSyncService,
		readonly formService: CampaignEditorState,
	) {}

	private viewValue: 'list' | 'editor' | 'notifications' = 'list';
	private selectedCampaignValue: Pick<CampaignSummary, 'id'> | null = null;

	readonly editorComponent = CampaignEditorComponent;
	readonly notificationComponent = NotificationsComponent;

	readonly view = () => this.viewValue;
	readonly selectedCampaign = () => this.selectedCampaignValue;
	readonly campaignState = () => this.campaignsState.getState() ?? initialCampaignState;
	readonly filters = () => this.campaignState().filters;
	readonly campaigns = () => this.campaignState().page.items;
	readonly page = () => this.campaignState().page;
	readonly loading = () => this.campaignState().loading;
	readonly errorMessage = () => this.campaignState().errorMessage;
	readonly pageNumbers = () => this.buildPageNumbers(this.page().totalPages, this.page().number);
	readonly hasNoCampaigns = () => !this.loading() && this.campaigns().length === 0;
	readonly handleNotificationBack = (): void => {
		this.showList();
	};
	readonly handleEditorBack = (): void => {
		this.showList();
	};
	readonly handleCampaignCreated = (campaign: CampaignCreateResponse): void => {
		this.reloadCampaignsFromRealtimeSync();
		this.storeSyncService.publish({
			type: CAMPAIGNS_SYNC_RELOAD_ACTION,
		});
		this.openCampaignNotifications(campaign);
	};

	ngOnInit(): void {
		this.viewValue = 'list';
		this.selectedCampaignValue = null;
		this.clearPreview();
		this.connectRealtime();
		this.connectMultiTabSync();

		this.campaignsState.state$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
			this.cdr.markForCheck();
		});

		this.campaignsState.setFilters({ ...this.campaignsState.getState().filters, page: 0 });
		this.loadCampaigns();
		this.loadTemplates();

		this.searchService.getSearch().pipe(debounceTime(250), takeUntilDestroyed(this.destroyRef)).subscribe((keyword) => {
			this.campaignsState.setFilters({ ...this.campaignsState.getState().filters, campaignName: keyword ?? '', page: 0 });
			this.loadCampaigns('network-first');
		});
	}

	showList(): void {
		this.viewValue = 'list';
		this.selectedCampaignValue = null;
		this.clearPreview();
		this.formService.resetFormState();
		this.searchService.setSearch('');
	}

	showEditor(): void {
		this.viewValue = 'editor';
		this.loadTemplates();
		this.selectedCampaignValue = null;
	}

	reloadList(): void {
		this.campaignsState.setFilters({ ...this.campaignsState.getState().filters, page: 0 });
		this.loadCampaigns();
	}

	updateStatus(status: string): void {
		this.campaignsState.setFilters({ ...this.campaignsState.getState().filters, status: this.normalizeStatus(status), page: 0 });
		this.loadCampaigns();
	}

	updateSortDirection(sortDirection: string): void {
		this.campaignsState.setFilters({ ...this.campaignsState.getState().filters, sortDirection: this.normalizeSortDirection(sortDirection), page: 0 });
		this.loadCampaigns();
	}

	updateRowsPerPage(size: string): void {
		const nextSize = Number(size) || 10;
		this.campaignsState.setFilters({ ...this.campaignsState.getState().filters, size: nextSize, page: 0 });
		this.loadCampaigns();
	}

	goToPage(page: number): void {
		const currentPage = this.page();
		if (page < 0 || page >= currentPage.totalPages || page === currentPage.number) {
			return;
		}
		this.campaignsState.setFilters({ ...this.campaignsState.getState().filters, page });
		this.loadCampaigns('network-first');
	}

	showCampaignNotifications(campaign: CampaignSummary): void {
		this.openCampaignNotifications(campaign);
	}

	trackByCampaignId(_: number, campaign: CampaignSummary): string {
		return campaign.id;
	}

	formatDate(value: string | null | undefined): string {
		if (!value) {
			return '-';
		}
		return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
	}

	getDisplayStatus(status: string): string {
		const normalized = status.toUpperCase();
		switch (normalized) {
			case 'ACTIVE': return 'Hoạt động';
			case 'COMPLETED': return 'Đã gửi';
			case 'EXPIRED': return 'Hết hạn';
			default: return status;
		}
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
			case 'PUSH': return 'fa-mobile-alt';
			case 'EMAIL': return 'fa-envelope';
			case 'SMS': return 'fa-comment-dots';
			default: return 'fa-bullhorn';
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
			case 'ACTIVE': return '#c575e2';
			case 'COMPLETED': return '#10b981';
			case 'EXPIRED': return '#ef4444';
			case 'DRAFT': return '#f59e0b';
			default: return '#cbd5e1';
		}
	}

	getStatusTextStyleColor(status: string): string {
		const normalized = status.toUpperCase();
		switch (normalized) {
			case 'ACTIVE': return '#c575e2';
			case 'COMPLETED': return '#047857';
			case 'EXPIRED': return '#dc2626';
			case 'DRAFT': return '#b45309';
			default: return '#475569';
		}
	}

	trackByTemplateId(_: number, template: { templateName: string }): string {
		return template.templateName;
	}

	trackByUserId(_: number, user: { id: number }): number {
		return user.id;
	}

	getDisplayChannel(channel: string): string {
		const channels = this.getChannelValues(channel);
		if (channels.length === 0) {
			return '-';
		}

		return channels.map((value) => {
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
		}).join(', ');
	}

	private loadCampaigns(optionCachePolicy: OptionCachePolicy = 'network-first'): void {
		const filters = this.campaignsState.getState().filters;
		this.campaignsState.setLoading(true);
		this.campaignsState.setErrorMessage(null);

		this.campaignsQuery.loadCampaigns(filters, optionCachePolicy).subscribe({
			next: (result) => {
				const page = normalizeCampaignPage(result.value);
				this.campaignsState.setPage(page);
				this.campaignsState.setLoaded(true);
				this.campaignsState.setLastFetched(result.fetchedAt);
				this.campaignsState.setLoading(false);
			},
			error: (error: unknown) => {
				this.campaignsState.setLoading(false);
				this.campaignsState.setErrorMessage(error instanceof Error ? error.message : 'Không thể tải danh sách chiến dịch.');
			},
		});
	}

	private loadTemplates(): void {
		this.formService.setTemplatesLoading(true);
		this.formService.setErrorMessage(null);

		this.campaignEditorQuery.loadTemplates().subscribe({
			next: (templates) => {
				this.formService.setTemplates(templates);
			},
			error: (error: unknown) => {
				this.formService.setTemplatesLoading(false);
				this.formService.setErrorMessage(error instanceof Error ? error.message : 'Không thể tải mẫu. Vui lòng thử lại.');
			},
		});
	}

	private clearPreview(): void {
		this.formService.clearPreview();
	}

	private connectRealtime(): void {
		this.websocket.watchCampaigns().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
			this.reloadCampaignsFromRealtimeSync();
		});
	}

	private connectMultiTabSync(): void {
		this.storeSyncService.messages$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((envelope: StoreSyncEnvelope) => {
			if (envelope.action.type !== CAMPAIGNS_SYNC_RELOAD_ACTION) {
				return;
			}

			this.reloadCampaignsFromRealtimeSync();
		});
	}

	private reloadCampaignsFromRealtimeSync(): void {
		this.campaignsState.setFilters({ ...this.campaignsState.getState().filters, page: 0 });
		this.loadCampaigns('network-first');
	}

	private normalizeStatus(status: string): CampaignStatusFilter {
		const normalized = status.toUpperCase();
		if (normalized === 'ACTIVE' || normalized === 'COMPLETED' || normalized === 'EXPIRED') {
			return normalized;
		}
		return 'ALL';
	}

	private normalizeSortDirection(sortDirection: string): CampaignSortDirection {
		if (sortDirection === '' || sortDirection.toLowerCase() === 'default') {
			return '';
		}
		return sortDirection.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
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

	private openCampaignNotifications(campaign: CampaignSummary | CampaignCreateResponse): void {
		this.formService.resetFormState();
		this.selectedCampaignValue = { id: String(campaign.id) };
		this.searchService.setSearch('');
		this.viewValue = 'notifications';
	}

	private getChannelValues(channel: string): string[] {
		if (!channel) {
			return [];
		}
		return channel.split(',').map((item) => item.trim().toUpperCase()).filter((item) => item.length > 0);
	}
}
