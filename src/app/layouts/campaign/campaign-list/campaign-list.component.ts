import { ChangeDetectionStrategy, Component, EventEmitter, OnInit, Output, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import * as CampaignActions from '../../../management/stores/campaign/campaign.actions';
import { selectCampaignState } from '../../../management/stores/campaign/campaign.selectors';
import {
	CampaignSortDirection,
	CampaignStatusFilter,
	CampaignSummary,
	defaultCampaignFilters,
	defaultCampaignPage,
} from '../../../management/models/campaign.model';

@Component({
	selector: 'app-campaign-list',
	imports: [CommonModule],
	templateUrl: './campaign-list.html',
	styleUrl: './campaign-list.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampaignListComponent implements OnInit {
	private readonly store = inject(Store);

	@Output() readonly create = new EventEmitter<void>();

	readonly campaignState = toSignal(
		this.store.select(selectCampaignState),
		{
			initialValue: {
				filters: defaultCampaignFilters,
				page: defaultCampaignPage,
				loading: false,
				errorMessage: null,
			},
		},
	);

	readonly filters = computed(() => this.campaignState().filters);
	readonly campaigns = computed(() => this.campaignState().page.items);
	readonly page = computed(() => this.campaignState().page);
	readonly loading = computed(() => this.campaignState().loading);
	readonly errorMessage = computed(() => this.campaignState().errorMessage);
	readonly pageNumbers = computed(() => this.buildPageNumbers(this.page().totalPages, this.page().number));
	readonly hasNoCampaigns = computed(() => !this.loading() && this.campaigns().length === 0);

	ngOnInit(): void {
		this.store.dispatch(CampaignActions.loadCampaigns());
	}

	reloadList(): void {
		this.store.dispatch(CampaignActions.setCampaignPage({ page: 0 }));
		this.store.dispatch(CampaignActions.loadCampaigns());
	}

	updateStatus(status: string): void {
		this.store.dispatch(CampaignActions.setCampaignStatus({ status: this.normalizeStatus(status) }));
		this.store.dispatch(CampaignActions.loadCampaigns());
	}

	updateSortDirection(sortDirection: string): void {
		this.store.dispatch(CampaignActions.setCampaignSortDirection({ sortDirection: this.normalizeSortDirection(sortDirection) }));
		this.store.dispatch(CampaignActions.loadCampaigns());
	}

	updateRowsPerPage(size: string): void {
		const nextSize = Number(size) || 10;
		this.store.dispatch(CampaignActions.setCampaignSize({ size: nextSize }));
		this.store.dispatch(CampaignActions.loadCampaigns());
	}

	goToPage(page: number): void {
		const currentPage = this.page();

		if (page < 0 || page >= currentPage.totalPages || page === currentPage.number) {
			return;
		}

		this.store.dispatch(CampaignActions.setCampaignPage({ page }));
		this.store.dispatch(CampaignActions.loadCampaigns());
	}

	trackByCampaignId(_: number, campaign: CampaignSummary): string {
		return campaign.id;
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

	getDisplayStatus(status: string): string {
		const normalized = status.toUpperCase();
		switch (normalized) {
			case 'SENT':
			case 'ACTIVE':
				return 'Đang hoạt động';
			case 'COMPLETED':
				return 'Đã hoàn thành';
			case 'EXPIRED':
				return 'Đã kết thúc';
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
			case 'ACTIVE':
			case 'COMPLETED':
				return '#10b981';
			case 'FAILED':
			case 'EXPIRED':
				return '#ef4444';
			case 'PENDING':
			case 'DRAFT':
				return '#f59e0b';
			default:
				return '#cbd5e1';
		}
	}

	getStatusTextStyleColor(status: string): string {
		const normalized = status.toUpperCase();
		switch (normalized) {
			case 'SENT':
			case 'ACTIVE':
			case 'COMPLETED':
				return '#047857';
			case 'FAILED':
			case 'EXPIRED':
				return '#dc2626';
			case 'PENDING':
			case 'DRAFT':
				return '#b45309';
			default:
				return '#475569';
		}
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

	private getChannelValues(channel: string): string[] {
		if (!channel) {
			return [];
		}

		return channel
			.split(',')
			.map((item) => item.trim().toUpperCase())
			.filter((item) => item.length > 0);
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
}