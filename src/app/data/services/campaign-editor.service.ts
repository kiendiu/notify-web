import { Injectable, computed, inject, signal } from '@angular/core';
import { CampaignChannel, CampaignCreateRequest, CampaignCreateResponse, CampaignTargetType } from '../../managements/models/campaigns.model';
import { CampaignEditorStateService, UsersSearchResponse } from '../../managements/states/campaign-editor.state';
import { CampaignEditorQuery } from '../../managements/queries/campaign-editor.query';
import { buildPreviewUsersCacheKey, CAMPAIGN_EDITOR_TTL_MS } from '../caches/campaign-editor.cache';
import { CACHE_ENGINE } from '../../core/stores/cache/cache.engine';

@Injectable({ providedIn: 'root' })
export class CampaignEditorService {
	private readonly cacheEngine = inject(CACHE_ENGINE);
	private readonly campaignEditorState = inject(CampaignEditorStateService);
	private readonly campaignEditorQuery = inject(CampaignEditorQuery);

	readonly campaignName = signal('');
	readonly targetType = signal<CampaignTargetType>('ALL');
	readonly selectedChannels = signal<CampaignChannel[]>(['PUSH']);
	readonly ratePerHour = signal(10000);
	readonly selectedTemplate = signal('');
	readonly pushTitle = signal('');
	readonly pushBody = signal('');
	readonly pushActionUrl = signal('');
	readonly scheduledTime = signal('');
	readonly endTime = signal('');
	readonly selectedUserIds = signal<number[]>([]);
	readonly recipientSearchDraft = signal('');
	readonly isSubmitting = signal(false);
	readonly submitError = signal('');
	readonly submitSuccess = signal<CampaignCreateResponse | null>(null);
	readonly showTemplateModal = signal(false);
	readonly templateSearch = signal('');
	readonly showUserModal = signal(false);
	readonly userSearch = signal('');
	readonly isSpecificTarget = computed(() => this.targetType() === 'SPECIFIC');

	readonly templates = this.campaignEditorState.templates;
	readonly users = this.campaignEditorState.users;
	readonly pushPreview = this.campaignEditorState.pushPreview;
	readonly emailPreview = this.campaignEditorState.emailPreview;

	readonly canSubmit = computed(() => {
		if (!this.campaignName().trim()) return false;
		if (this.selectedChannels().length === 0) return false;
		if (!this.scheduledTime()) return false;
		if (this.isSpecificTarget() && this.selectedUserIds().length === 0) return false;
		if (!this.selectedTemplate().trim() && (!this.pushTitle().trim() || !this.pushBody().trim())) return false;
		return true;
	});

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

		const found = this.templates().find((template) => template.templateName === templateName);
		if (found) {
			this.pushTitle.set(found.subject ?? '');
			this.pushBody.set(found.content ?? '');
			this.updatePreview();
			return;
		}

		this.pushTitle.set('');
		this.pushBody.set('');
		this.updatePreview();
		this.submitError.set('Không tìm thấy template đã chọn.');
	}

	onPushTitleChange(value: string): void {
		this.pushTitle.set(value);
		this.updatePreview();
	}

	onPushBodyChange(value: string): void {
		this.pushBody.set(value);
		this.updatePreview();
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
			this.selectedUserIds.set(current.filter((item) => item !== userId));
			return;
		}

		this.selectedUserIds.set([...current, userId]);
	}

	clearUserSelection(): void {
		this.selectedUserIds.set([]);
		this.submitError.set('');
	}

	onUserSelect(userId: number): void {
		this.toggleUserSelection(userId);
	}

	isUserSelected(userId: number): boolean {
		return this.selectedUserIds().includes(userId);
	}

	onUserSearch(keyword: string): void {
		this.userSearch.set(keyword);
		this.campaignEditorQuery.searchUsers(keyword, 0, 100).subscribe();
	}

	onRecipientSearchChange(keyword: string): void {
		this.recipientSearchDraft.set(keyword);
	}

	onRecipientSelectionChange(optionList: ArrayLike<HTMLOptionElement>): void {
		const selectedIds = Array.from(optionList).map((option) => Number(option.value)).filter((value) => Number.isFinite(value));
		this.selectedUserIds.set(selectedIds);
	}

	onTargetTypeChange(targetType: string): void {
		this.targetType.set(targetType as CampaignTargetType);
		this.submitError.set('');

		if (targetType !== 'SPECIFIC') {
			this.selectedUserIds.set([]);
			this.recipientSearchDraft.set('');
			return;
		}

		const cacheKey = buildPreviewUsersCacheKey('', 0, 100);
		const cachedUsers = this.cacheEngine.get<UsersSearchResponse>(cacheKey);
		if (!this.cacheEngine.isFresh(cachedUsers, CAMPAIGN_EDITOR_TTL_MS)) {
			this.campaignEditorQuery.searchUsers('', 0, 100).subscribe();
			return;
		}

		const cachedUserList = cachedUsers!.value.content ?? [];
		if (cachedUserList.length > 0) {
			this.campaignEditorState.setUsers(cachedUserList);
		}
	}

	loadTemplates(): void {
		this.campaignEditorQuery.loadTemplates().subscribe();
	}

	resetFormState(): void {
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
		this.submitSuccess.set(null);
	}

	buildCreateRequest(): CampaignCreateRequest {
		return {
			name: this.campaignName().trim(),
			targetType: this.targetType(),
			targetUserIds: this.selectedUserIds(),
			channel: this.selectedChannels(),
			ratePerHour: this.ratePerHour(),
			templateName: this.selectedTemplate().trim() || null,
			pushTitle: this.pushTitle().trim() || null,
			pushBody: this.pushBody().trim() || null,
			pushActionUrl: this.pushActionUrl().trim() || null,
			scheduledTime: this.scheduledTime(),
			endTime: this.endTime() || null,
		};
	}

	createCampaign(): void {
		this.isSubmitting.set(true);
		this.submitError.set('');
		this.submitSuccess.set(null);

		this.campaignEditorQuery.createCampaign(this.buildCreateRequest()).subscribe({
			next: (campaign: CampaignCreateResponse) => {
				this.submitSuccess.set(campaign);
				this.isSubmitting.set(false);
			},
			error: (error: unknown) => {
				this.submitError.set(error instanceof Error ? error.message : 'Không thể tạo chiến dịch. Vui lòng thử lại.');
				this.isSubmitting.set(false);
			},
		});
	}

	submitCampaign(): void {
		this.createCampaign();
	}

	private updatePreview(): void {
		const templateName = this.selectedTemplate().trim() || null;
		const pushTitle = this.pushTitle().trim() || null;
		const pushBody = this.pushBody().trim() || null;
		this.campaignEditorState.setPushPreview(pushTitle || pushBody ? { title: pushTitle ?? '', body: pushBody ?? '' } : null);
		this.campaignEditorState.setEmailPreview(templateName ? { subject: pushTitle ?? '', content: pushBody ?? '' } : null);
	}
}
