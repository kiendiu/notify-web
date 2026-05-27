import { ChangeDetectionStrategy, Component, DestroyRef, Injector, OnInit, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs';

import { CampaignsQuery } from '../../managements/queries/campaigns.query';
import { CampaignCreateResponse, CampaignSummary } from '../../managements/models/campaigns.model';
import { CampaignSortDirection, CampaignStatusFilter, CampaignSummary as CampaignListSummary } from '../../managements/models/campaigns.model';
import { CampaignEditorService } from '../../data/services/campaign-editor';
import { NotificationService as ToastService } from '../../layouts/components/notification-toast/notification-toast.service';
import { UiStateService } from '../../core/stores/state/ui-state.service';
import { CampaignEditorComponent } from './campaign-editor/campaign-editor.controller';
import { NotificationsComponent } from './notifications/notifications.controller';
import { SearchService } from '../../data/services/search.service';
import { CampaignsStateService } from '../../managements/states/campaigns.state';

@Component({
	selector: 'app-campaigns',
	standalone: true,
	imports: [CommonModule],
	templateUrl: './campaigns.component.html',
	styleUrl: './campaigns.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampaignsComponent implements OnInit {
	private readonly campaignsQuery = inject(CampaignsQuery);
	private readonly campaignsState = inject(CampaignsStateService);
	private readonly destroyRef = inject(DestroyRef);
	private readonly injector = inject(Injector);
	private readonly uiState = inject(UiStateService);
	private readonly notificationService = inject(ToastService);
	private readonly searchService = inject(SearchService);
	readonly formService = inject(CampaignEditorService);

	readonly view = signal<'list' | 'editor' | 'notifications'>('list');
	readonly selectedCampaign = signal<Pick<CampaignSummary, 'id'> | null>(null);
	readonly editorComponent = CampaignEditorComponent;
	readonly notificationComponent = NotificationsComponent;
	readonly searchKeyword = signal('');
	readonly campaignState = this.campaignsState.state;
	readonly filters = computed(() => this.campaignState().filters);
	readonly campaigns = computed(() => this.campaignState().page.items);
	readonly page = computed(() => this.campaignState().page);
	readonly loading = computed(() => this.campaignState().loading);
	readonly errorMessage = computed(() => this.campaignState().errorMessage);
	readonly pageNumbers = computed(() => this.buildPageNumbers(this.page().totalPages, this.page().number));
	readonly hasNoCampaigns = computed(() => !this.loading() && this.campaigns().length === 0);
	readonly handleNotificationBack = (): void => {
		this.showList();
	};

	readonly filteredTemplates = computed(() => {
		const q = this.formService.templateSearch().trim().toLowerCase();
		if (!q) {
			return this.formService.templates();
		}
		return this.formService.templates().filter((template) => {
			const haystack = (template.templateName + ' ' + (template.subject || '') + ' ' + (template.content || '')).toLowerCase();
			return haystack.includes(q);
		});
	});

	readonly filteredUsers = computed(() => {
		const q = this.formService.userSearch().trim().toLowerCase();
		if (!q) {
			return this.formService.users();
		}
		return this.formService.users().filter((user) => (user.name + ' ' + user.email).toLowerCase().includes(q));
	});

	readonly selectedChannelsLabel = computed(() => this.getDisplayChannel(this.formService.selectedChannels().join(',')));

	readonly selectedRecipientNamesLabel = computed(() => {
		const usersById = new Map(this.formService.users().map((user) => [user.id, user.name]));
		const selectedNames = this.formService.selectedUserIds().map((userId) => usersById.get(userId)).filter((name): name is string => Boolean(name && name.trim()));
		if (selectedNames.length > 0) {
			return selectedNames.join(', ');
		}
		return `${this.formService.selectedUserIds().length} người đã chọn`;
	});

	readonly handleEditorBack = (): void => {
		this.showList();
	};

	constructor() {
		this.bindViewState();
	}

	ngOnInit(): void {
	  this.init();
	}

	private init(): void {
		this.view.set('list');
		this.selectedCampaign.set(null);

		this.campaignsQuery.clearPreview();
		this.campaignsQuery.connectRealtime();

		this.campaignsQuery.setCampaignPage(0);
		this.campaignsQuery.loadCampaigns();
		this.campaignsQuery.loadTemplates();
	}

	private bindViewState(): void {
		this.uiState.bindViewState({
			viewKey: 'campaign-view',
			selectedKey: 'campaign-selected-id',
			defaultView: 'list',
			view: this.view,
			selected: this.selectedCampaign,
			injector: this.injector,
			serializeSelected: (campaign) => String(campaign.id),
			deserializeSelected: (rawValue) => {
				if (!rawValue || rawValue === '-1' || rawValue === 'undefined' || rawValue === 'null') {
					return null;
				}
				return { id: rawValue };
			},
		});
	}

	showList(): void {
		this.view.set('list');
		this.selectedCampaign.set(null);
		this.campaignsQuery.clearPreview();
		this.formService.resetFormState();
	}

	showEditor(): void {
		this.view.set('editor');
		this.campaignsQuery.loadTemplates();
		this.selectedCampaign.set(null);
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

	trackByCampaignId(_: number, campaign: CampaignListSummary): string {
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
		this.selectedCampaign.set({ id: String(campaign.id) });
		this.view.set('notifications');
	}
}