import { ChangeDetectionStrategy, Component, OnInit, OnDestroy, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import * as CampaignActions from '../../management/stores/campaign/campaign.actions';
import * as PreviewActions from '../../management/stores/preview/preview.actions';
import { selectCampaignState } from '../../management/stores/campaign/campaign.selectors';
import { 
  selectPushPreview, 
  selectEmailPreview, 
  selectTemplates,
  selectUsers,
  selectTemplatesLoading,
} from '../../management/stores/preview/preview.selectors';
import { CampaignChannel, CampaignCreateRequest, CampaignSortDirection, CampaignStatusFilter, CampaignSummary, CampaignTargetType, defaultCampaignFilters, defaultCampaignPage } from '../../management/models/campaign.model';

@Component({
	selector: 'app-campaign',
	imports: [CommonModule],
	templateUrl: './campaign.html',
	styleUrl: './campaign.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampaignComponent implements OnInit {
	private readonly store = inject(Store);

	readonly view = signal<'list' | 'create'>('list');
	readonly selectedChannels = signal<CampaignChannel[]>(['PUSH']);
	readonly searchDraft = signal(defaultCampaignFilters.campaignName);
	readonly recipientSearchDraft = signal('');
	readonly isSubmitting = signal(false);
	readonly submitError = signal('');

	// Form state
	readonly campaignName = signal('');
	readonly targetType = signal<CampaignTargetType>('ALL');
	readonly ratePerHour = signal(10000);
	readonly selectedTemplate = signal('');
	readonly pushTitle = signal('');
	readonly pushBody = signal('');
	readonly pushActionUrl = signal('');
	readonly scheduledTime = signal('');
	readonly endTime = signal('');
	readonly selectedUserIds = signal<number[]>([]);

	// Template modal & search
	readonly showTemplateModal = signal(false);
	readonly templateSearch = signal('');
	readonly filteredTemplates = computed(() => {
		const q = this.templateSearch().trim().toLowerCase();
		if (!q) return this.templates();
		return this.templates().filter((t) => {
			const hay = (t.templateName + ' ' + (t.subject || '') + ' ' + (t.content || '')).toLowerCase();
			return hay.includes(q);
		});
	});

	// User modal & search
	readonly showUserModal = signal(false);
	readonly userSearch = signal('');
	readonly filteredUsers = computed(() => {
		const q = this.userSearch().trim().toLowerCase();
		if (!q) return this.users();
		return this.users().filter((u) => {
			const hay = (u.name + ' ' + u.email).toLowerCase();
			return hay.includes(q);
		});
	});

	// Campaign state
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

	// Preview state
	readonly pushPreview = toSignal(this.store.select(selectPushPreview), { initialValue: null });
	readonly emailPreview = toSignal(this.store.select(selectEmailPreview), { initialValue: null });
	readonly templates = toSignal(this.store.select(selectTemplates), { initialValue: [] });
	readonly users = toSignal(this.store.select(selectUsers), { initialValue: [] });
	readonly templatesLoading = toSignal(this.store.select(selectTemplatesLoading), { initialValue: false });

	// Computed
	readonly filters = computed(() => this.campaignState().filters);
	readonly campaigns = computed(() => this.campaignState().page.items);
	readonly page = computed(() => this.campaignState().page);
	readonly loading = computed(() => this.campaignState().loading);
	readonly errorMessage = computed(() => this.campaignState().errorMessage);
	readonly pageNumbers = computed(() => this.buildPageNumbers(this.page().totalPages, this.page().number));
	readonly previewChannel = computed(() => this.selectedChannels()[0] ?? 'PUSH');
	readonly selectedChannelsLabel = computed(() => this.getDisplayChannel(this.selectedChannels().join(',')));
	readonly isSpecificTarget = computed(() => this.targetType() === 'SPECIFIC');
	readonly selectedRecipientNamesLabel = computed(() => {
		const usersById = new Map(this.users().map((user) => [user.id, user.name]));
		const selectedNames = this.selectedUserIds()
			.map((userId) => usersById.get(userId))
			.filter((name): name is string => Boolean(name && name.trim()));

		if (selectedNames.length > 0) {
			return selectedNames.join(', ');
		}

		return `${this.selectedUserIds().length} người đã chọn`;
	});
	readonly canSubmit = computed(() => {
		if (!this.campaignName().trim()) {
			return false;
		}

		if (this.selectedChannels().length === 0) {
			return false;
		}

		if (!this.scheduledTime()) {
			return false;
		}

		if (this.isSpecificTarget() && this.selectedUserIds().length === 0) {
			return false;
		}

		if (!this.selectedTemplate().trim() && (!this.pushTitle().trim() || !this.pushBody().trim())) {
			return false;
		}

		return true;
	});
	readonly hasNoCampaigns = computed(() => 
		!this.loading() && this.campaigns().length === 0
	);

	ngOnInit(): void {
		this.searchDraft.set(this.filters().campaignName);
		this.store.dispatch(CampaignActions.loadCampaigns());
		this.store.dispatch(PreviewActions.loadTemplates());
	}

	showList(): void {
		this.view.set('list');
		this.store.dispatch(PreviewActions.clearPreview());
		this.resetFormState();
		this.submitError.set('');
	}

	reloadList(): void {
		this.store.dispatch(CampaignActions.setCampaignPage({ page: 0 }));
		this.store.dispatch(CampaignActions.loadCampaigns());
	}

	showCreate(): void {
		this.view.set('create');
		this.store.dispatch(PreviewActions.loadTemplates());
		this.submitError.set('');
	}

	updateSearchDraft(value: string): void {
		this.searchDraft.set(value);
	}

	applySearch(): void {
		this.store.dispatch(CampaignActions.setCampaignName({ campaignName: this.searchDraft().trim() }));
		this.store.dispatch(CampaignActions.setCampaignPage({ page: 0 }));
		this.store.dispatch(CampaignActions.loadCampaigns());
	}

	clearSearch(): void {
		this.searchDraft.set('');
		this.store.dispatch(CampaignActions.setCampaignName({ campaignName: '' }));
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

	toggleChannel(channel: CampaignChannel): void {
		const current = this.selectedChannels();
		if (current.includes(channel)) {
			if (current.length === 1) {
				return;
			}

			this.selectedChannels.set(current.filter((item) => item !== channel));
			return;
		}

		this.selectedChannels.set([...current, channel]);
	}

	onTemplateChange(templateName: string): void {
		this.selectedTemplate.set(templateName);
		this.submitError.set('');

		if (!templateName) {
			this.pushTitle.set('');
			this.pushBody.set('');
			this.updatePreview();
			return;
		}

		const found = this.templates().find((t) => t.templateName === templateName);
		if (found) {
			this.pushTitle.set(found.subject ?? '');
			this.pushBody.set(found.content ?? '');
			this.updatePreview();
		} else {
			this.pushTitle.set('');
			this.pushBody.set('');
			this.updatePreview();
			this.submitError.set('Không tìm thấy template đã chọn.');
		}
	}

	openTemplateModal(): void {
		this.templateSearch.set('');
		this.showTemplateModal.set(true);
	}

	closeTemplateModal(): void {
		this.showTemplateModal.set(false);
	}

	selectTemplateFromModal(templateName: string): void {
		this.onTemplateChange(templateName);
		this.showTemplateModal.set(false);
	}

	clearTemplate(): void {
		this.onTemplateChange('');
		this.submitError.set('');
	}

	openUserModal(): void {
		this.userSearch.set('');
		this.showUserModal.set(true);
	}

	closeUserModal(): void {
		this.showUserModal.set(false);
	}

	toggleUserSelection(userId: number): void {
		const current = this.selectedUserIds();
		if (current.includes(userId)) {
			this.selectedUserIds.set(current.filter((id) => id !== userId));
		} else {
			this.selectedUserIds.set([...current, userId]);
		}
	}

	clearUserSelection(): void {
		this.selectedUserIds.set([]);
		this.submitError.set('');
	}

	onPushTitleChange(title: string): void {
		if (this.selectedTemplate()) {
			return;
		}
		this.pushTitle.set(title);
		this.updatePreview();
	}

	onPushBodyChange(body: string): void {
		if (this.selectedTemplate()) {
			return;
		}
		this.pushBody.set(body);
		this.updatePreview();
	}

	onEmailSubjectChange(subject: string): void {
		this.pushTitle.set(subject);
		this.updatePreview();
	}

	onEmailContentChange(content: string): void {
		this.pushBody.set(content);
		this.updatePreview();
	}

	private updatePreview(): void {
		const pushPreview = {
			title: this.pushTitle(),
			body: this.pushBody(),
		};
		this.store.dispatch(PreviewActions.updatePushPreview({ pushPreview }));

		const emailPreview = {
			subject: this.pushTitle(),
			content: this.pushBody(),
		};
		this.store.dispatch(PreviewActions.updateEmailPreview({ emailPreview }));
	}

	onTargetTypeChange(targetType: string): void {
		this.targetType.set(targetType as CampaignTargetType);
		this.submitError.set('');
		if (targetType !== 'SPECIFIC') {
			this.selectedUserIds.set([]);
			this.recipientSearchDraft.set('');
			return;
		}

		if (targetType === 'SPECIFIC') {
			this.store.dispatch(PreviewActions.searchUsers({ keyword: '', page: 0, size: 100 }));
		}
	}

	onUserSearch(keyword: string): void {
		this.store.dispatch(PreviewActions.searchUsers({ keyword, page: 0, size: 100 }));
	}

	onRecipientSearchChange(keyword: string): void {
		this.recipientSearchDraft.set(keyword);
	}

	onRecipientSelectionChange(optionList: ArrayLike<HTMLOptionElement>): void {
		const selectedIds = Array.from(optionList)
			.map((option) => Number(option.value))
			.filter((value) => Number.isFinite(value));

		this.selectedUserIds.set(selectedIds);
	}

	isUserSelected(userId: number): boolean {
		return this.selectedUserIds().includes(userId);
	}

	createCampaign(): void {
		this.submitError.set('');

		if (!this.canSubmit()) {
			if (!this.selectedChannels().length) {
				this.submitError.set('Vui lòng chọn ít nhất một kênh gửi.');
				return;
			}

			if (this.isSpecificTarget() && this.selectedUserIds().length === 0) {
				this.submitError.set('Vui lòng chọn ít nhất một người nhận.');
				return;
			}

			if (!this.selectedTemplate().trim() && (!this.pushTitle().trim() || !this.pushBody().trim())) {
				this.submitError.set('Vui lòng nhập tiêu đề và nội dung hoặc chọn template.');
				return;
			}

			this.submitError.set('Vui lòng điền đầy đủ thông tin bắt buộc.');
			return;
		}

		const request: CampaignCreateRequest = {
			name: this.campaignName().trim(),
			targetType: this.targetType(),
			targetUserIds: this.isSpecificTarget() ? this.selectedUserIds() : undefined,
			channel: this.selectedChannels(),
			ratePerHour: Number(this.ratePerHour()) || 0,
			templateName: this.selectedTemplate().trim() || null,
			pushTitle: this.selectedTemplate().trim() ? null : this.pushTitle().trim(),
			pushBody: this.selectedTemplate().trim() ? null : this.pushBody().trim(),
			pushActionUrl: this.pushActionUrl().trim() || null,
			scheduledTime: this.scheduledTime(),
			endTime: this.endTime() || null,
		};
		this.store.dispatch(CampaignActions.createCampaign({ request }));
	}

	onUserSelect(userId: number): void {
		const current = this.selectedUserIds();
		if (current.includes(userId)) {
			this.selectedUserIds.set(current.filter(id => id !== userId));
		} else {
			this.selectedUserIds.set([...current, userId]);
		}
	}

	trackByCampaignId(_: number, campaign: { id: string }): string {
		return campaign.id;
	}

	trackByTemplateId(_: number, template: { templateName: string }): string {
		return template.templateName;
	}

	trackByUserId(_: number, user: { id: number }): number {
		return user.id;
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

		if (channels.length > 1) {
			return 'default';
		}

		if (channels.length === 0) {
			return 'default';
		}

		return channels[0].toLowerCase();
	}

	getSentProgress(campaign: CampaignSummary): number {
		if (!campaign.totalTarget || campaign.totalTarget <= 0) {
			return 0;
		}

		return Math.min(100, Math.round((campaign.sentStatus.sent / campaign.totalTarget) * 100));
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

	getStatusColor(status: string): string {
		const normalized = status.toUpperCase();
		// Map backend status to UI status
		switch (normalized) {
			case 'SENT':
			case 'ACTIVE':
			case 'COMPLETED':
				return 'bg-emerald-500';
			case 'FAILED':
			case 'EXPIRED':
				return 'bg-rose-500';
			case 'PENDING':
			case 'DRAFT':
				return 'bg-amber-500';
			default:
				return 'bg-slate-400';
		}
	}

	getStatusTextColor(status: string): string {
		const normalized = status.toUpperCase();
		switch (normalized) {
			case 'SENT':
			case 'ACTIVE':
			case 'COMPLETED':
				return 'text-emerald-700';
			case 'FAILED':
			case 'EXPIRED':
				return 'text-rose-700';
			case 'PENDING':
			case 'DRAFT':
				return 'text-amber-700';
			default:
				return 'text-slate-600';
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

	private resetFormState(): void {
		this.campaignName.set('');
		this.targetType.set('ALL');
		this.selectedChannels.set(['PUSH']);
		this.ratePerHour.set(10000);
		this.selectedTemplate.set('');
		this.pushTitle.set('');
		this.pushBody.set('');
		this.pushActionUrl.set('');
		this.scheduledTime.set('');
		this.endTime.set('');
		this.selectedUserIds.set([]);
		this.recipientSearchDraft.set('');
		this.submitError.set('');
		this.isSubmitting.set(false);
	}
}
