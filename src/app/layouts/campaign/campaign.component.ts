import {ChangeDetectionStrategy,Component,OnInit,computed,inject,signal,} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';

import * as CampaignActions from '../../management/stores/campaign/campaign.actions';
import * as PreviewActions from '../../management/stores/preview/preview.actions';

import {selectPushPreview,selectEmailPreview,selectTemplates,selectUsers} from '../../management/stores/preview/preview.selectors';

import {CampaignChannel,CampaignCreateRequest,CampaignSummary,CampaignTargetType,} from '../../management/models/campaign.model';

import { CampaignListComponent } from './campaign-list/campaign-list.component';
import { CampaignPreviewComponent } from './campaign-preview/campaign-preview.component';
import { CampaignNotificationComponent } from './campaign-notification/campaign-notification.component';

@Component({
	selector: 'app-campaign',
	imports: [
		CommonModule,
		CampaignListComponent,
		CampaignPreviewComponent,
	],
	templateUrl: './campaign.html',
	styleUrl: './campaign.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampaignComponent implements OnInit {

	//dependency injection
	private readonly store = inject(Store);

	// view state
	readonly view = signal<'list' | 'create' | 'notifications'>('list');
	readonly selectedCampaign = signal<CampaignSummary | null>(null);
	readonly notificationComponent = CampaignNotificationComponent;
	readonly handleNotificationBack = (): void => {
		this.showList();
	};

	//form state
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

	// template modal state
	readonly showTemplateModal = signal(false);
	readonly templateSearch = signal('');

	// user modal state
	readonly showUserModal = signal(false);
	readonly userSearch = signal('');

	//store signals
	readonly pushPreview = toSignal(
		this.store.select(selectPushPreview),
		{ initialValue: null },
	);
	readonly emailPreview = toSignal(
		this.store.select(selectEmailPreview),
		{ initialValue: null },
	);
	readonly templates = toSignal(
		this.store.select(selectTemplates),
		{ initialValue: [] },
	);
	readonly users = toSignal(
		this.store.select(selectUsers),
		{ initialValue: [] },
	);

	//computed
	readonly filteredTemplates = computed(() => {
		const q = this.templateSearch().trim().toLowerCase();
		if (!q) {
			return this.templates();
		}
		return this.templates().filter((template) => {
			const haystack = (
				template.templateName +
				' ' +
				(template.subject || '') +
				' ' +
				(template.content || '')
			).toLowerCase();

			return haystack.includes(q);
		});
	});

	readonly filteredUsers = computed(() => {
		const q = this.userSearch().trim().toLowerCase();
		if (!q) {
			return this.users();
		}
		return this.users().filter((user) => {
			const haystack = (
				user.name +
				' ' +
				user.email
			).toLowerCase();

			return haystack.includes(q);
		});
	});

	readonly selectedChannelsLabel = computed(() =>
		this.getDisplayChannel(this.selectedChannels().join(',')),
	);

	readonly isSpecificTarget = computed(() =>
		this.targetType() === 'SPECIFIC',
	);

	readonly selectedRecipientNamesLabel = computed(() => {
		const usersById = new Map(
			this.users().map((user) => [user.id, user.name]),
		);

		const selectedNames = this.selectedUserIds()
			.map((userId) => usersById.get(userId))
			.filter((name): name is string =>
				Boolean(name && name.trim()),
			);

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
		if ( !this.selectedTemplate().trim() &&
			(
				!this.pushTitle().trim() ||
				!this.pushBody().trim()
			)
		) {
			return false;
		}
		return true;
	});

	//lifecycle
	ngOnInit(): void {
		this.store.dispatch(
			PreviewActions.loadTemplates(),
		);
	}

	//view methods
	showList(): void {
		this.view.set('list');
		this.selectedCampaign.set(null);
		this.store.dispatch( PreviewActions.clearPreview(), );
		this.resetFormState();
		this.submitError.set('');
	}

	showCreate(): void {
		this.view.set('create');

		this.store.dispatch(
			PreviewActions.loadTemplates(),
		);

		this.submitError.set('');

		this.selectedCampaign.set(null);
	}

	showCampaignNotifications( campaign: CampaignSummary,): void {
		this.selectedCampaign.set(campaign);
		this.view.set('notifications');
	}

	//channel methods
	toggleChannel(channel: CampaignChannel): void {
		const current = this.selectedChannels();
		if (current.includes(channel)) {
			if (current.length === 1) {
				return;
			}
			this.selectedChannels.set(
				current.filter((item) => item !== channel),
			);
			return;
		}
		this.selectedChannels.set([
			...current,
			channel,
		]);
	}

	//template methods
	openTemplateModal(): void {
		this.templateSearch.set('');
		this.showTemplateModal.set(true);
	}

	closeTemplateModal(): void {
		this.showTemplateModal.set(false);
	}

	selectTemplateFromModal(templateName: string,): void {
		this.onTemplateChange(templateName);
		this.showTemplateModal.set(false);
	}

	clearTemplate(): void {
		this.onTemplateChange('');
		this.submitError.set('');
	}

	onTemplateChange(templateName: string,): void {
		this.selectedTemplate.set(templateName);
		this.submitError.set('');
		if (!templateName) {
			this.pushTitle.set('');
			this.pushBody.set('');
			this.updatePreview();
			return;
		}
		const found = this.templates().find(
			(template) =>
				template.templateName === templateName,
		);
		if (found) {
			this.pushTitle.set(found.subject ?? '');
			this.pushBody.set(found.content ?? '');
			this.updatePreview();
			return;
		}
		this.pushTitle.set('');
		this.pushBody.set('');
		this.updatePreview();
		this.submitError.set(
			'Không tìm thấy template đã chọn.',
		);
	}

	//user methods
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
			this.selectedUserIds.set(
				current.filter((id) => id !== userId),
			);
			return;
		}
		this.selectedUserIds.set([
			...current,
			userId,
		]);
	}

	clearUserSelection(): void {
		this.selectedUserIds.set([]);
		this.submitError.set('');
	}

	onUserSelect(userId: number): void {
		const current = this.selectedUserIds();
		if (current.includes(userId)) {
			this.selectedUserIds.set(
				current.filter((id) => id !== userId),
			);
			return;
		}
		this.selectedUserIds.set([
			...current,
			userId,
		]);
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
			}),
		);
	}

	onRecipientSearchChange(keyword: string): void {
		this.recipientSearchDraft.set(keyword);
	}

	onRecipientSelectionChange(optionList: ArrayLike<HTMLOptionElement>,): void {
		const selectedIds = Array
			.from(optionList)
			.map((option) => Number(option.value))
			.filter((value) => Number.isFinite(value));
		this.selectedUserIds.set(selectedIds);
	}

	//target type methods
	onTargetTypeChange(targetType: string): void {
		this.targetType.set(
			targetType as CampaignTargetType,
		);
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
			}),
		);
	}

	//content preview methods
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
		this.store.dispatch(
			PreviewActions.updatePushPreview({
				pushPreview,
			}),
		);
		const emailPreview = {
			subject: this.pushTitle(),
			content: this.pushBody(),
		};
		this.store.dispatch(
			PreviewActions.updateEmailPreview({
				emailPreview,
			}),
		);
	}

	//submit campaign method
	createCampaign(): void {
		this.submitError.set('');
		if (!this.canSubmit()) {
			if (!this.selectedChannels().length) {
				this.submitError.set('Vui lòng chọn ít nhất một kênh gửi.',);
				return;
			}
			if (this.isSpecificTarget() && this.selectedUserIds().length === 0) {
				this.submitError.set('Vui lòng chọn ít nhất một người nhận.',);
				return;
			}
			if (!this.selectedTemplate().trim() &&
				(
					!this.pushTitle().trim() ||
					!this.pushBody().trim()
				)
			) {
				this.submitError.set('Vui lòng nhập tiêu đề và nội dung hoặc chọn template.',);
				return;
			}
			this.submitError.set('Vui lòng điền đầy đủ thông tin bắt buộc.',);
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
		this.store.dispatch( CampaignActions.createCampaign({request,}),);
	}

	//trackBy methods
	trackByTemplateId(
		_: number,
		template: { templateName: string },
	): string {
		return template.templateName;
	}

	trackByUserId(
		_: number,
		user: { id: number },
	): number {
		return user.id;
	}

	//display methods
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

	private getChannelValues(channel: string): string[] {
		if (!channel) {
			return [];
		}
		return channel
			.split(',')
			.map((item) =>
				item.trim().toUpperCase(),
			)
			.filter((item) => item.length > 0);
	}

	//reset form state to initial values
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
// import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { Store } from '@ngrx/store';
// import { toSignal } from '@angular/core/rxjs-interop';
// import * as CampaignActions from '../../management/stores/campaign/campaign.actions';
// import * as PreviewActions from '../../management/stores/preview/preview.actions';
// import { 
//   selectPushPreview, 
//   selectEmailPreview, 
//   selectTemplates,
//   selectUsers,
// } from '../../management/stores/preview/preview.selectors';
// import { CampaignListComponent } from './campaign-list/campaign-list.component';
// import { CampaignPreviewComponent } from './campaign-preview/campaign-preview.component';
// import { CampaignNotificationComponent } from './campaign-notification/campaign-notification.component';
// import { CampaignChannel, CampaignCreateRequest, CampaignTargetType, CampaignSummary } from '../../management/models/campaign.model';

// @Component({
// 	selector: 'app-campaign',
// 	imports: [CommonModule, CampaignListComponent, CampaignPreviewComponent],
// 	templateUrl: './campaign.html',
// 	styleUrl: './campaign.scss',
// 	changeDetection: ChangeDetectionStrategy.OnPush,
// })
// export class CampaignComponent implements OnInit {
// 	private readonly store = inject(Store);

// 	readonly view = signal<'list' | 'create' | 'notifications'>('list');
// 	readonly selectedCampaign = signal<CampaignSummary | null>(null);
// 	readonly notificationComponent = CampaignNotificationComponent;
// 	readonly handleNotificationBack = (): void => {
// 		this.showList();
// 	};
// 	readonly selectedChannels = signal<CampaignChannel[]>(['PUSH']);
// 	readonly recipientSearchDraft = signal('');
// 	readonly isSubmitting = signal(false);
// 	readonly submitError = signal('');

// 	// Form state
// 	readonly campaignName = signal('');
// 	readonly targetType = signal<CampaignTargetType>('ALL');
// 	readonly ratePerHour = signal(10000);
// 	readonly selectedTemplate = signal('');
// 	readonly pushTitle = signal('');
// 	readonly pushBody = signal('');
// 	readonly pushActionUrl = signal('');
// 	readonly scheduledTime = signal('');
// 	readonly endTime = signal('');
// 	readonly selectedUserIds = signal<number[]>([]);

// 	// Template modal & search
// 	readonly showTemplateModal = signal(false);
// 	readonly templateSearch = signal('');
// 	readonly filteredTemplates = computed(() => {
// 		const q = this.templateSearch().trim().toLowerCase();
// 		if (!q) return this.templates();
// 		return this.templates().filter((t) => {
// 			const hay = (t.templateName + ' ' + (t.subject || '') + ' ' + (t.content || '')).toLowerCase();
// 			return hay.includes(q);
// 		});
// 	});

// 	// User modal & search
// 	readonly showUserModal = signal(false);
// 	readonly userSearch = signal('');
// 	readonly filteredUsers = computed(() => {
// 		const q = this.userSearch().trim().toLowerCase();
// 		if (!q) return this.users();
// 		return this.users().filter((u) => {
// 			const hay = (u.name + ' ' + u.email).toLowerCase();
// 			return hay.includes(q);
// 		});
// 	});

// 	// Preview state
// 	readonly pushPreview = toSignal(this.store.select(selectPushPreview), { initialValue: null });
// 	readonly emailPreview = toSignal(this.store.select(selectEmailPreview), { initialValue: null });
// 	readonly templates = toSignal(this.store.select(selectTemplates), { initialValue: [] });
// 	readonly users = toSignal(this.store.select(selectUsers), { initialValue: [] });

// 	// Computed
// 	readonly selectedChannelsLabel = computed(() => this.getDisplayChannel(this.selectedChannels().join(',')));
// 	readonly isSpecificTarget = computed(() => this.targetType() === 'SPECIFIC');
// 	readonly selectedRecipientNamesLabel = computed(() => {
// 		const usersById = new Map(this.users().map((user) => [user.id, user.name]));
// 		const selectedNames = this.selectedUserIds()
// 			.map((userId) => usersById.get(userId))
// 			.filter((name): name is string => Boolean(name && name.trim()));

// 		if (selectedNames.length > 0) {
// 			return selectedNames.join(', ');
// 		}

// 		return `${this.selectedUserIds().length} người đã chọn`;
// 	});
// 	readonly canSubmit = computed(() => {
// 		if (!this.campaignName().trim()) {
// 			return false;
// 		}

// 		if (this.selectedChannels().length === 0) {
// 			return false;
// 		}

// 		if (!this.scheduledTime()) {
// 			return false;
// 		}

// 		if (this.isSpecificTarget() && this.selectedUserIds().length === 0) {
// 			return false;
// 		}

// 		if (!this.selectedTemplate().trim() && (!this.pushTitle().trim() || !this.pushBody().trim())) {
// 			return false;
// 		}

// 		return true;
// 	});

// 	ngOnInit(): void {
// 		this.store.dispatch(PreviewActions.loadTemplates());
// 	}

// 	showList(): void {
// 		this.view.set('list');
// 		this.selectedCampaign.set(null);
// 		this.store.dispatch(PreviewActions.clearPreview());
// 		this.resetFormState();
// 		this.submitError.set('');
// 	}

// 	showCampaignNotifications(campaign: CampaignSummary): void {
// 		this.selectedCampaign.set(campaign);
// 		this.view.set('notifications');
// 	}

// 	showCreate(): void {
// 		this.view.set('create');
// 		this.store.dispatch(PreviewActions.loadTemplates());
// 		this.submitError.set('');
// 		this.selectedCampaign.set(null);
// 	}

// 	toggleChannel(channel: CampaignChannel): void {
// 		const current = this.selectedChannels();
// 		if (current.includes(channel)) {
// 			if (current.length === 1) {
// 				return;
// 			}

// 			this.selectedChannels.set(current.filter((item) => item !== channel));
// 			return;
// 		}

// 		this.selectedChannels.set([...current, channel]);
// 	}

// 	onTemplateChange(templateName: string): void {
// 		this.selectedTemplate.set(templateName);
// 		this.submitError.set('');

// 		if (!templateName) {
// 			this.pushTitle.set('');
// 			this.pushBody.set('');
// 			this.updatePreview();
// 			return;
// 		}

// 		const found = this.templates().find((t) => t.templateName === templateName);
// 		if (found) {
// 			this.pushTitle.set(found.subject ?? '');
// 			this.pushBody.set(found.content ?? '');
// 			this.updatePreview();
// 		} else {
// 			this.pushTitle.set('');
// 			this.pushBody.set('');
// 			this.updatePreview();
// 			this.submitError.set('Không tìm thấy template đã chọn.');
// 		}
// 	}

// 	openTemplateModal(): void {
// 		this.templateSearch.set('');
// 		this.showTemplateModal.set(true);
// 	}

// 	closeTemplateModal(): void {
// 		this.showTemplateModal.set(false);
// 	}

// 	selectTemplateFromModal(templateName: string): void {
// 		this.onTemplateChange(templateName);
// 		this.showTemplateModal.set(false);
// 	}

// 	clearTemplate(): void {
// 		this.onTemplateChange('');
// 		this.submitError.set('');
// 	}

// 	openUserModal(): void {
// 		this.userSearch.set('');
// 		this.showUserModal.set(true);
// 	}

// 	closeUserModal(): void {
// 		this.showUserModal.set(false);
// 	}

// 	toggleUserSelection(userId: number): void {
// 		const current = this.selectedUserIds();
// 		if (current.includes(userId)) {
// 			this.selectedUserIds.set(current.filter((id) => id !== userId));
// 		} else {
// 			this.selectedUserIds.set([...current, userId]);
// 		}
// 	}

// 	clearUserSelection(): void {
// 		this.selectedUserIds.set([]);
// 		this.submitError.set('');
// 	}

// 	onPushTitleChange(title: string): void {
// 		if (this.selectedTemplate()) {
// 			return;
// 		}
// 		this.pushTitle.set(title);
// 		this.updatePreview();
// 	}

// 	onPushBodyChange(body: string): void {
// 		if (this.selectedTemplate()) {
// 			return;
// 		}
// 		this.pushBody.set(body);
// 		this.updatePreview();
// 	}

// 	onEmailSubjectChange(subject: string): void {
// 		this.pushTitle.set(subject);
// 		this.updatePreview();
// 	}

// 	onEmailContentChange(content: string): void {
// 		this.pushBody.set(content);
// 		this.updatePreview();
// 	}

// 	private updatePreview(): void {
// 		const pushPreview = {
// 			title: this.pushTitle(),
// 			body: this.pushBody(),
// 		};
// 		this.store.dispatch(PreviewActions.updatePushPreview({ pushPreview }));

// 		const emailPreview = {
// 			subject: this.pushTitle(),
// 			content: this.pushBody(),
// 		};
// 		this.store.dispatch(PreviewActions.updateEmailPreview({ emailPreview }));
// 	}

// 	onTargetTypeChange(targetType: string): void {
// 		this.targetType.set(targetType as CampaignTargetType);
// 		this.submitError.set('');
// 		if (targetType !== 'SPECIFIC') {
// 			this.selectedUserIds.set([]);
// 			this.recipientSearchDraft.set('');
// 			return;
// 		}

// 		if (targetType === 'SPECIFIC') {
// 			this.store.dispatch(PreviewActions.searchUsers({ keyword: '', page: 0, size: 100 }));
// 		}
// 	}

// 	onUserSearch(keyword: string): void {
// 		this.store.dispatch(PreviewActions.searchUsers({ keyword, page: 0, size: 100 }));
// 	}

// 	onRecipientSearchChange(keyword: string): void {
// 		this.recipientSearchDraft.set(keyword);
// 	}

// 	onRecipientSelectionChange(optionList: ArrayLike<HTMLOptionElement>): void {
// 		const selectedIds = Array.from(optionList)
// 			.map((option) => Number(option.value))
// 			.filter((value) => Number.isFinite(value));

// 		this.selectedUserIds.set(selectedIds);
// 	}

// 	isUserSelected(userId: number): boolean {
// 		return this.selectedUserIds().includes(userId);
// 	}

// 	createCampaign(): void {
// 		this.submitError.set('');

// 		if (!this.canSubmit()) {
// 			if (!this.selectedChannels().length) {
// 				this.submitError.set('Vui lòng chọn ít nhất một kênh gửi.');
// 				return;
// 			}

// 			if (this.isSpecificTarget() && this.selectedUserIds().length === 0) {
// 				this.submitError.set('Vui lòng chọn ít nhất một người nhận.');
// 				return;
// 			}

// 			if (!this.selectedTemplate().trim() && (!this.pushTitle().trim() || !this.pushBody().trim())) {
// 				this.submitError.set('Vui lòng nhập tiêu đề và nội dung hoặc chọn template.');
// 				return;
// 			}

// 			this.submitError.set('Vui lòng điền đầy đủ thông tin bắt buộc.');
// 			return;
// 		}

// 		const request: CampaignCreateRequest = {
// 			name: this.campaignName().trim(),
// 			targetType: this.targetType(),
// 			targetUserIds: this.isSpecificTarget() ? this.selectedUserIds() : undefined,
// 			channel: this.selectedChannels(),
// 			ratePerHour: Number(this.ratePerHour()) || 0,
// 			templateName: this.selectedTemplate().trim() || null,
// 			pushTitle: this.selectedTemplate().trim() ? null : this.pushTitle().trim(),
// 			pushBody: this.selectedTemplate().trim() ? null : this.pushBody().trim(),
// 			pushActionUrl: this.pushActionUrl().trim() || null,
// 			scheduledTime: this.scheduledTime(),
// 			endTime: this.endTime() || null,
// 		};
// 		this.store.dispatch(CampaignActions.createCampaign({ request }));
// 	}

// 	onUserSelect(userId: number): void {
// 		const current = this.selectedUserIds();
// 		if (current.includes(userId)) {
// 			this.selectedUserIds.set(current.filter(id => id !== userId));
// 		} else {
// 			this.selectedUserIds.set([...current, userId]);
// 		}
// 	}

// 	trackByTemplateId(_: number, template: { templateName: string }): string {
// 		return template.templateName;
// 	}

// 	trackByUserId(_: number, user: { id: number }): number {
// 		return user.id;
// 	}

// 	getDisplayChannel(channel: string): string {
// 		const channels = this.getChannelValues(channel);

// 		if (channels.length === 0) {
// 			return '-';
// 		}

// 		return channels
// 			.map((value) => {
// 				switch (value) {
// 					case 'PUSH':
// 						return 'Push';
// 					case 'EMAIL':
// 						return 'Email';
// 					case 'SMS':
// 						return 'Message';
// 					default:
// 						return value;
// 				}
// 			})
// 			.join(', ');
// 	}

// 	private getChannelValues(channel: string): string[] {
// 		if (!channel) {
// 			return [];
// 		}

// 		return channel
// 			.split(',')
// 			.map((item) => item.trim().toUpperCase())
// 			.filter((item) => item.length > 0);
// 	}

// 	private resetFormState(): void {
// 		this.campaignName.set('');
// 		this.targetType.set('ALL');
// 		this.selectedChannels.set(['PUSH']);
// 		this.ratePerHour.set(10000);
// 		this.selectedTemplate.set('');
// 		this.pushTitle.set('');
// 		this.pushBody.set('');
// 		this.pushActionUrl.set('');
// 		this.scheduledTime.set('');
// 		this.endTime.set('');
// 		this.selectedUserIds.set([]);
// 		this.recipientSearchDraft.set('');
// 		this.submitError.set('');
// 		this.isSubmitting.set(false);
// 	}
// }
