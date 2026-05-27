import { ChangeDetectorRef, DestroyRef, Injectable, Injector, inject } from '@angular/core';
import { debounceTime } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SearchService } from '../../data/services/search.service';
import { CampaignCreateResponse, CampaignSummary, CampaignSortDirection, CampaignStatusFilter } from '../../managements/models/campaigns.model';
import { CampaignsQuery } from '../../managements/queries/campaigns.query';
import { CampaignsStateService, initialCampaignState } from '../../managements/states/campaigns.state';
import { CampaignEditorState } from '../../managements/states/campaign-editor.state';
import { CampaignEditorComponent } from './campaign-editor/campaign-editor.component';
import { NotificationsComponent } from './notifications/notifications.component';

@Injectable()
export class CampaignsController {
	private readonly campaignsQuery = inject(CampaignsQuery);
	private readonly campaignsState = inject(CampaignsStateService);
	private readonly searchService = inject(SearchService);
	private readonly cdr = inject(ChangeDetectorRef);
	readonly formService = inject(CampaignEditorState);

	private viewValue: 'list' | 'editor' | 'notifications' = 'list';
	private selectedCampaignValue: Pick<CampaignSummary, 'id'> | null = null;
	private campaignStateValue = initialCampaignState;
	readonly editorComponent = CampaignEditorComponent;
	readonly notificationComponent = NotificationsComponent;

	readonly view = () => this.viewValue;
	readonly selectedCampaign = () => this.selectedCampaignValue;
	readonly campaignState = () => this.campaignStateValue;
	readonly filters = () => this.campaignStateValue.filters;
	readonly campaigns = () => this.campaignStateValue.page.items;
	readonly page = () => this.campaignStateValue.page;
	readonly loading = () => this.campaignStateValue.loading;
	readonly errorMessage = () => this.campaignStateValue.errorMessage;
	readonly pageNumbers = () => this.buildPageNumbers(this.page().totalPages, this.page().number);
	readonly hasNoCampaigns = () => !this.loading() && this.campaigns().length === 0;
	readonly handleNotificationBack = (): void => {
		this.showList();
	};

	readonly handleEditorBack = (): void => {
		this.showList();
	};

	readonly handleCampaignCreated = (campaign: CampaignCreateResponse): void => {
		this.openCampaignNotifications(campaign);
	};

	init(destroyRef: DestroyRef, injector: Injector): void {
		this.viewValue = 'list';
		this.selectedCampaignValue = null;

		this.campaignsState.state$.pipe(takeUntilDestroyed(destroyRef)).subscribe((state) => {
			this.campaignStateValue = state ?? initialCampaignState;
			this.cdr.markForCheck();
		});

		this.campaignsQuery.clearPreview();
		this.campaignsQuery.connectRealtime();

		this.campaignsQuery.setCampaignPage(0);
		this.campaignsQuery.loadCampaigns();
		this.campaignsQuery.loadTemplates();

		this.searchService.getSearch().pipe(debounceTime(250), takeUntilDestroyed(destroyRef)).subscribe((keyword) => {
			this.campaignsQuery.setCampaignName(keyword ?? '');
			this.campaignsQuery.loadCampaigns();
		});
	}

	showList(): void {
		this.viewValue = 'list';
		this.selectedCampaignValue = null;
		this.campaignsQuery.clearPreview();
		this.formService.resetFormState();
		this.searchService.setSearch('');
	}

	showEditor(): void {
		this.viewValue = 'editor';
		this.campaignsQuery.loadTemplates();
		this.selectedCampaignValue = null;
	}

	reloadList(): void {
		this.campaignsQuery.setCampaignPage(0);
		this.loadCampaigns();
	}

	updateStatus(status: string): void {
		this.campaignsQuery.setCampaignStatus(this.normalizeStatus(status));
		this.loadCampaigns();
	}

	updateSortDirection(sortDirection: string): void {
		this.campaignsQuery.setCampaignSortDirection(this.normalizeSortDirection(sortDirection));
		this.loadCampaigns();
	}

	updateRowsPerPage(size: string): void {
		const nextSize = Number(size) || 10;
		this.campaignsQuery.setCampaignSize(nextSize);
		this.loadCampaigns();
	}

	goToPage(page: number): void {
		const currentPage = this.page();
		if (page < 0 || page >= currentPage.totalPages || page === currentPage.number) {
			return;
		}
		this.campaignsQuery.setCampaignPage(page);
		this.loadCampaigns();
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
		if (channels.length > 1) { return 'fa-layer-group'; }
		if (channels.length === 0) { return 'fa-bullhorn'; }
		switch (channels[0]) {
			case 'PUSH': return 'fa-mobile-alt';
			case 'EMAIL': return 'fa-envelope';
			case 'SMS': return 'fa-comment-dots';
			default: return 'fa-bullhorn';
		}
	}

	getChannelBadgeClass(channel: string): string {
		const channels = this.getChannelValues(channel);
		if (channels.length > 1 || channels.length === 0) { return 'default'; }
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

	private getChannelValues(channel: string): string[] {
		if (!channel) {
			return [];
		}
		return channel.split(',').map((item) => item.trim().toUpperCase()).filter((item) => item.length > 0);
	}

	private loadCampaigns(): void {
		this.campaignsQuery.loadCampaigns();
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
}