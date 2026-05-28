import {
	Injectable,
	OnDestroy,
	inject,
} from '@angular/core';

import { map } from 'rxjs';

import {
	CampaignChannel,
	CampaignCreateRequest,
	CampaignCreateResponse,
	CampaignTargetType,
} from '../models/campaigns.model';

import { StateService } from '../../core/stores/state/state.service';

export interface TemplateDto {
	templateName: string;
	subject: string;
	content: string;
}

export interface TemplatePreviewDto {
	templateName: string;
	subject: string;
	content: string;
}

export interface PushPreview {
	title: string;
	body: string;
}

export interface EmailPreview {
	subject: string;
	content: string;
}

export interface UserDto {
	id: number;
	name: string;
	email: string;
	status?: string;
}

export interface UsersSearchResponse {
	content: UserDto[];
	number: number;
	size: number;
	totalElements: number;
	totalPages: number;
	last: boolean;
	first: boolean;
}

export interface CampaignEditorStateModel {
	templates: TemplateDto[];
	users: UserDto[];
	campaignName: string;
	targetType: CampaignTargetType;
	selectedChannels: CampaignChannel[];
	ratePerHour: number;
	selectedTemplate: string;
	pushTitle: string;
	pushBody: string;
	pushActionUrl: string;
	scheduledTime: string;
	endTime: string;
	selectedUserIds: number[];
	recipientSearchDraft: string;
	isSubmitting: boolean;
	submitError: string;
	submitSuccess: CampaignCreateResponse | null;
	showTemplateModal: boolean;
	templateSearch: string;
	showUserModal: boolean;
	userSearch: string;

	templatePreview:
		| TemplatePreviewDto
		| null;

	pushPreview:
		| PushPreview
		| null;

	emailPreview:
		| EmailPreview
		| null;

	templatesLoading: boolean;
	userSearchLoading: boolean;

	templatesLoaded: boolean;
	usersLoaded: boolean;

	templatesLastFetched:
		| number
		| null;

	usersLastFetched:
		| number
		| null;

	errorMessage:
		| string
		| null;
}

export const initialCampaignEditorState: CampaignEditorStateModel =
	{
		templates: [],
		users: [],
		campaignName: '',
		targetType: 'ALL',
		selectedChannels: ['PUSH'],
		ratePerHour: 10000,
		selectedTemplate: '',
		pushTitle: '',
		pushBody: '',
		pushActionUrl: '',
		scheduledTime: '',
		endTime: '',
		selectedUserIds: [],
		recipientSearchDraft: '',
		isSubmitting: false,
		submitError: '',
		submitSuccess: null,
		showTemplateModal: false,
		templateSearch: '',
		showUserModal: false,
		userSearch: '',

		templatePreview: null,
		pushPreview: null,
		emailPreview: null,

		templatesLoading: false,
		userSearchLoading: false,

		templatesLoaded: false,
		usersLoaded: false,

		templatesLastFetched: null,
		usersLastFetched: null,

		errorMessage: null,
	};

@Injectable()
export class CampaignEditorState
	implements OnDestroy
{
	private readonly stateKey =
		'kien-notify-web:state:campaign-editor';

	private readonly stateService =
		inject(StateService);

	readonly state$ =
		this.stateService
			.watch<CampaignEditorStateModel>(
				this.stateKey,
			)
			.pipe(
				map(
					(state) =>
						state ??
						initialCampaignEditorState,
				),
			);

	constructor() {
		const current =
			this.stateService.get<CampaignEditorStateModel>(
				this.stateKey,
			);

		if (!current) {
			this.stateService.set(
				this.stateKey,
				initialCampaignEditorState,
			);
		}
	}

	campaignName(): string {
		return this.getState().campaignName;
	}

	targetType(): CampaignTargetType {
		return this.getState().targetType;
	}

	selectedChannels(): CampaignChannel[] {
		return this.getState().selectedChannels;
	}

	ratePerHour(): number {
		return this.getState().ratePerHour;
	}

	selectedTemplate(): string {
		return this.getState().selectedTemplate;
	}

	pushTitle(): string {
		return this.getState().pushTitle;
	}

	pushBody(): string {
		return this.getState().pushBody;
	}

	pushActionUrl(): string {
		return this.getState().pushActionUrl;
	}

	scheduledTime(): string {
		return this.getState().scheduledTime;
	}

	endTime(): string {
		return this.getState().endTime;
	}

	selectedUserIds(): number[] {
		return this.getState().selectedUserIds;
	}

	recipientSearchDraft(): string {
		return this.getState().recipientSearchDraft;
	}

	isSubmitting(): boolean {
		return this.getState().isSubmitting;
	}

	submitError(): string {
		return this.getState().submitError;
	}

	submitSuccess(): CampaignCreateResponse | null {
		return this.getState().submitSuccess;
	}

	showTemplateModal(): boolean {
		return this.getState().showTemplateModal;
	}

	templateSearch(): string {
		return this.getState().templateSearch;
	}

	showUserModal(): boolean {
		return this.getState().showUserModal;
	}

	userSearch(): string {
		return this.getState().userSearch;
	}

	isSpecificTarget(): boolean {
		return this.targetType() === 'SPECIFIC';
	}

	templates(): TemplateDto[] {
		return this.getState().templates;
	}

	users(): UserDto[] {
		return this.getState().users;
	}

	pushPreview(): PushPreview | null {
		return this.getState().pushPreview;
	}

	emailPreview(): EmailPreview | null {
		return this.getState().emailPreview;
	}

	canSubmit(): boolean {
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
	}

	getState(): CampaignEditorStateModel {
		return (
			this.stateService.get<CampaignEditorStateModel>(
				this.stateKey,
			) ??
			initialCampaignEditorState
		);
	}

	setCampaignName(campaignName: string): void {
		this.patch({ campaignName });
	}

	setTargetType(targetType: CampaignTargetType): void {
		this.patch({ targetType });
	}

	setSelectedChannels(selectedChannels: CampaignChannel[]): void {
		this.patch({ selectedChannels });
	}

	setRatePerHour(ratePerHour: number): void {
		this.patch({ ratePerHour });
	}

	setSelectedTemplate(selectedTemplate: string): void {
		this.patch({ selectedTemplate });
	}

	setPushTitle(pushTitle: string): void {
		this.patch({ pushTitle });
	}

	setPushBody(pushBody: string): void {
		this.patch({ pushBody });
	}

	setPushActionUrl(pushActionUrl: string): void {
		this.patch({ pushActionUrl });
	}

	setScheduledTime(scheduledTime: string): void {
		this.patch({ scheduledTime });
	}

	setEndTime(endTime: string): void {
		this.patch({ endTime });
	}

	setSelectedUserIds(selectedUserIds: number[]): void {
		this.patch({ selectedUserIds });
	}

	setRecipientSearchDraft(recipientSearchDraft: string): void {
		this.patch({ recipientSearchDraft });
	}

	setIsSubmitting(isSubmitting: boolean): void {
		this.patch({ isSubmitting });
	}

	setSubmitError(submitError: string): void {
		this.patch({ submitError });
	}

	setSubmitSuccess(submitSuccess: CampaignCreateResponse | null): void {
		this.patch({ submitSuccess });
	}

	setShowTemplateModal(showTemplateModal: boolean): void {
		this.patch({ showTemplateModal });
	}

	setTemplateSearch(templateSearch: string): void {
		this.patch({ templateSearch });
	}

	setShowUserModal(showUserModal: boolean): void {
		this.patch({ showUserModal });
	}

	setUserSearch(userSearch: string): void {
		this.patch({ userSearch });
	}

	setTemplates(templates: TemplateDto[]): void {
		this.patch({
			templates,
			templatesLoaded: true,
			templatesLoading: false,
			templatesLastFetched: Date.now(),
		});
	}

	setTemplatesLoading(loading: boolean): void {
		this.patch({ templatesLoading: loading });
	}

	setUsersFromResponse(response: UsersSearchResponse): void {
		this.patch({
			users: response.content ?? [],
			usersLoaded: true,
			userSearchLoading: false,
			usersLastFetched: Date.now(),
		});
	}

	setUserSearchLoading(loading: boolean): void {
		this.patch({ userSearchLoading: loading });
	}

	setErrorMessage(errorMessage: string | null): void {
		this.patch({ errorMessage });
	}

	patch(
		partial: Partial<CampaignEditorStateModel>,
	): void {
		this.stateService.update<CampaignEditorStateModel>(
			this.stateKey,
			(current) => ({
				...initialCampaignEditorState,
				...(current ??
					initialCampaignEditorState),
				...partial,
			}),
		);
	}

	clear(): void {
		this.stateService.set(
			this.stateKey,
			initialCampaignEditorState,
		);
	}

	clearPreview(): void {
		this.patch({
			templatePreview: null,
			pushPreview: null,
			emailPreview: null,
		});
	}

	toggleChannel(channel: CampaignChannel): void {
		const current = this.selectedChannels();
		if (current.includes(channel)) {
			if (current.length === 1) {
				return;
			}
			this.setSelectedChannels(current.filter((item) => item !== channel));
			return;
		}
		this.setSelectedChannels([...current, channel]);
	}

	openTemplateModal(): void {
		this.setTemplateSearch('');
		this.setShowTemplateModal(true);
	}

	closeTemplateModal(): void {
		this.setShowTemplateModal(false);
	}

	selectTemplateFromModal(templateName: string): void {
		this.onTemplateChange(templateName);
		this.setShowTemplateModal(false);
	}

	clearTemplate(): void {
		this.onTemplateChange('');
	}

	onTemplateChange(templateName: string): void {
		this.setSelectedTemplate(templateName);

		const found = this.templates().find(
			(template) => template.templateName === templateName,
		);

		if (!found) {
			this.setPushTitle('');
			this.setPushBody('');
			this.updatePreview();
			return;
		}

		this.setPushTitle(found.subject ?? '');
		this.setPushBody(found.content ?? '');
		this.updatePreview();
	}

	onPushTitleChange(value: string): void {
		this.setPushTitle(value);
		this.updatePreview();
	}

	onPushBodyChange(value: string): void {
		this.setPushBody(value);
		this.updatePreview();
	}

	openUserModal(): void {
		this.setUserSearch('');
		this.setShowUserModal(true);
	}

	closeUserModal(): void {
		this.setShowUserModal(false);
	}

	toggleUserSelection(userId: number): void {
		const current = this.selectedUserIds();
		if (current.includes(userId)) {
			this.setSelectedUserIds(current.filter((item) => item !== userId));
			return;
		}
		this.setSelectedUserIds([...current, userId]);
	}

	clearUserSelection(): void {
		this.setSelectedUserIds([]);
	}

	isUserSelected(userId: number): boolean {
		return this.selectedUserIds().includes(userId);
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

	resetFormState(): void {
		this.patch({
			campaignName: '',
			targetType: 'ALL',
			selectedChannels: ['PUSH'],
			ratePerHour: 10000,
			selectedTemplate: '',
			pushTitle: '',
			pushBody: '',
			pushActionUrl: '',
			scheduledTime: '',
			endTime: '',
			selectedUserIds: [],
			recipientSearchDraft: '',
			isSubmitting: false,
			submitError: '',
			submitSuccess: null,
			showTemplateModal: false,
			templateSearch: '',
			showUserModal: false,
			userSearch: '',
		});
		this.clearPreview();
	}

	private updatePreview(): void {
		const pushTitle = this.pushTitle().trim();
		const pushBody = this.pushBody().trim();

		this.patch({
			pushPreview: pushTitle || pushBody
				? { title: pushTitle, body: pushBody }
				: null,
		});
	}

	ngOnDestroy(): void {
		this.stateService.remove(
			this.stateKey,
		);
	}
}