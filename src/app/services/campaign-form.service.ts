import { Injectable, computed, inject, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import * as PreviewActions from '../management/stores/preview/preview.actions';
import { CampaignChannel, CampaignCreateRequest, CampaignTargetType } from '../management/models/campaign.model';
import { selectTemplates } from '../management/stores/preview/preview.selectors';
import * as CampaignActions from '../management/stores/campaign/campaign.actions';

@Injectable({ providedIn: 'root' })
export class CampaignFormService {
	private readonly store = inject(Store);
	private readonly templates = toSignal(
		this.store.select(selectTemplates),
		{ initialValue: [] }
	);

	// Form state signals
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

	// Template modal state
	readonly showTemplateModal = signal(false);
	readonly templateSearch = signal('');

	// User modal state
	readonly showUserModal = signal(false);
	readonly userSearch = signal('');

	// Computed signals
	readonly isSpecificTarget = computed(() => this.targetType() === 'SPECIFIC');

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
		if (
			!this.selectedTemplate().trim() &&
			(!this.pushTitle().trim() || !this.pushBody().trim())
		) {
			return false;
		}
		return true;
	});

	// Channel methods
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

	// Template modal methods
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

	// User modal methods
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
			return;
		}
		this.selectedUserIds.set([...current, userId]);
	}

	clearUserSelection(): void {
		this.selectedUserIds.set([]);
		this.submitError.set('');
	}

	onUserSelect(userId: number): void {
		const current = this.selectedUserIds();
		if (current.includes(userId)) {
			this.selectedUserIds.set(current.filter((id) => id !== userId));
			return;
		}
		this.selectedUserIds.set([...current, userId]);
	}

	isUserSelected(userId: number): boolean {
		return this.selectedUserIds().includes(userId);
	}

	onUserSearch(keyword: string): void {
		this.store.dispatch(
			PreviewActions.searchUsers({
				keyword,
				page: 0,
				size: 100,
			})
		);
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

	// Target type methods
	onTargetTypeChange(targetType: string): void {
		this.targetType.set(targetType as CampaignTargetType);
		this.submitError.set('');
		if (targetType !== 'SPECIFIC') {
			this.selectedUserIds.set([]);
			this.recipientSearchDraft.set('');
			return;
		}
		this.store.dispatch(
			PreviewActions.searchUsers({
				keyword: '',
				page: 0,
				size: 100,
			})
		);
	}

	// Content preview methods
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

	// Submit campaign method
	createCampaign(): void {
		this.submitError.set('');
		this.isSubmitting.set(true);
		if (!this.canSubmit()) {
			if (!this.selectedChannels().length) {
				this.submitError.set('Vui lòng chọn ít nhất một kênh gửi.');
				return;
			}
			if (this.isSpecificTarget() && this.selectedUserIds().length === 0) {
				this.submitError.set('Vui lòng chọn ít nhất một người nhận.');
				return;
			}
			if (
				!this.selectedTemplate().trim() &&
				(!this.pushTitle().trim() || !this.pushBody().trim())
			) {
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

	// Reset form state to initial values
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
		this.isSubmitting.set(false);
	}
}
