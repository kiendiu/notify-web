import { Injectable, computed, signal } from '@angular/core';

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

export interface CampaignEditorState {
	templates: TemplateDto[];
	templatePreview: TemplatePreviewDto | null;
	pushPreview: PushPreview | null;
	emailPreview: EmailPreview | null;
	users: UserDto[];
	userSearchLoading: boolean;
	templatesLoading: boolean;
	templatePreviewLoading: boolean;
	templatesLoaded: boolean;
	templatesLastFetched: number | null;
	usersLoaded: boolean;
	usersLastFetched: number | null;
	templatePreviewLoaded: boolean;
	templatePreviewLastFetched: number | null;
	errorMessage: string | null;
	isSubmitting: boolean;
	submitError: string;
	showTemplateModal: boolean;
	templateSearch: string;
	showUserModal: boolean;
	userSearch: string;
}

export const initialCampaignEditorState: CampaignEditorState = {
	templates: [],
	templatePreview: null,
	pushPreview: null,
	emailPreview: null,
	users: [],
	userSearchLoading: false,
	templatesLoading: false,
	templatePreviewLoading: false,
	templatesLoaded: false,
	templatesLastFetched: null,
	usersLoaded: false,
	usersLastFetched: null,
	templatePreviewLoaded: false,
	templatePreviewLastFetched: null,
	errorMessage: null,
	isSubmitting: false,
	submitError: '',
	showTemplateModal: false,
	templateSearch: '',
	showUserModal: false,
	userSearch: '',
};

@Injectable({ providedIn: 'root' })
export class CampaignEditorStateService {
	readonly templates = signal<TemplateDto[]>([]);
	readonly templatePreview = signal<TemplatePreviewDto | null>(null);
	readonly pushPreview = signal<PushPreview | null>(null);
	readonly emailPreview = signal<EmailPreview | null>(null);
	readonly users = signal<UserDto[]>([]);
	readonly userSearchLoading = signal(false);
	readonly templatesLoading = signal(false);
	readonly templatePreviewLoading = signal(false);
	readonly templatesLoaded = signal(false);
	readonly templatesLastFetched = signal<number | null>(null);
	readonly usersLoaded = signal(false);
	readonly usersLastFetched = signal<number | null>(null);
	readonly templatePreviewLoaded = signal(false);
	readonly templatePreviewLastFetched = signal<number | null>(null);
	readonly errorMessage = signal<string | null>(null);
	readonly isSubmitting = signal(false);
	readonly submitError = signal('');
	readonly showTemplateModal = signal(false);
	readonly templateSearch = signal('');
	readonly showUserModal = signal(false);
	readonly userSearch = signal('');
	readonly state = computed<CampaignEditorState>(() => ({
		templates: this.templates(),
		templatePreview: this.templatePreview(),
		pushPreview: this.pushPreview(),
		emailPreview: this.emailPreview(),
		users: this.users(),
		userSearchLoading: this.userSearchLoading(),
		templatesLoading: this.templatesLoading(),
		templatePreviewLoading: this.templatePreviewLoading(),
		templatesLoaded: this.templatesLoaded(),
		templatesLastFetched: this.templatesLastFetched(),
		usersLoaded: this.usersLoaded(),
		usersLastFetched: this.usersLastFetched(),
		templatePreviewLoaded: this.templatePreviewLoaded(),
		templatePreviewLastFetched: this.templatePreviewLastFetched(),
		errorMessage: this.errorMessage(),
		isSubmitting: this.isSubmitting(),
		submitError: this.submitError(),
		showTemplateModal: this.showTemplateModal(),
		templateSearch: this.templateSearch(),
		showUserModal: this.showUserModal(),
		userSearch: this.userSearch(),
	}));

	setTemplates(templates: TemplateDto[]): void { this.templates.set(templates); }
	setUsers(users: UserDto[]): void { this.users.set(users); }
	setPushPreview(pushPreview: PushPreview | null): void { this.pushPreview.set(pushPreview); }
	setEmailPreview(emailPreview: EmailPreview | null): void { this.emailPreview.set(emailPreview); }
	setTemplatePreview(templatePreview: TemplatePreviewDto | null): void { this.templatePreview.set(templatePreview); }
	setTemplatesLoading(isLoading: boolean): void { this.templatesLoading.set(isLoading); }
	setUserSearchLoading(isLoading: boolean): void { this.userSearchLoading.set(isLoading); }
	setTemplatesLoaded(isLoaded: boolean): void { this.templatesLoaded.set(isLoaded); }
	setTemplatesLastFetched(timestamp: number | null): void { this.templatesLastFetched.set(timestamp); }
	setUsersLoaded(isLoaded: boolean): void { this.usersLoaded.set(isLoaded); }
	setUsersLastFetched(timestamp: number | null): void { this.usersLastFetched.set(timestamp); }
	setTemplatePreviewLoaded(isLoaded: boolean): void { this.templatePreviewLoaded.set(isLoaded); }
	setTemplatePreviewLastFetched(timestamp: number | null): void { this.templatePreviewLastFetched.set(timestamp); }
	setErrorMessage(message: string | null): void { this.errorMessage.set(message); }
	resetPreviews(): void {
		this.templatePreview.set(null);
		this.pushPreview.set(null);
		this.emailPreview.set(null);
	}
	clear(): void {
		this.templates.set([]);
		this.templatePreview.set(null);
		this.pushPreview.set(null);
		this.emailPreview.set(null);
		this.users.set([]);
		this.userSearchLoading.set(false);
		this.templatesLoading.set(false);
		this.templatePreviewLoading.set(false);
		this.templatesLoaded.set(false);
		this.templatesLastFetched.set(null);
		this.usersLoaded.set(false);
		this.usersLastFetched.set(null);
		this.templatePreviewLoaded.set(false);
		this.templatePreviewLastFetched.set(null);
		this.errorMessage.set(null);
		this.isSubmitting.set(false);
		this.submitError.set('');
		this.showTemplateModal.set(false);
		this.templateSearch.set('');
		this.showUserModal.set(false);
		this.userSearch.set('');
	}
}