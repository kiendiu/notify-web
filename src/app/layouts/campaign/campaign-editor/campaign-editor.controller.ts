import { Injectable, inject } from '@angular/core';

import { CampaignCreateResponse } from '../../../managements/models/campaigns.model';
import { CampaignEditorQuery } from '../../../managements/queries/campaign-editor.query';
import { CampaignEditorState, TemplateDto, UserDto } from '../../../managements/states/campaign-editor.state';

@Injectable()
export class CampaignEditorController {
    readonly formService = inject(CampaignEditorState);
    private readonly campaignQuery = inject(CampaignEditorQuery);
    private onCreatedCallback: ((campaign: CampaignCreateResponse) => void) | null = null;

    readonly pushPreview = () => this.formService.pushPreview();
    readonly emailPreview = () => this.formService.emailPreview();
    readonly templates = () => this.formService.templates();
    readonly users = () => this.formService.users();
    readonly filteredTemplates = () => {
        const query = this.formService.templateSearch().trim().toLowerCase();
        if (!query) {
            return this.templates();
        }

        return this.templates().filter((template: TemplateDto) => {
            const haystack = [template.templateName, template.subject ?? '', template.content ?? '']
                .join(' ')
                .toLowerCase();
            return haystack.includes(query);
        });
    };

    readonly filteredUsers = () => {
        const query = this.formService.userSearch().trim().toLowerCase();
        if (!query) {
            return this.users();
        }

        return this.users().filter((user: UserDto) => (user.name + ' ' + user.email).toLowerCase().includes(query));
    };

    readonly selectedChannelsLabel = () => this.getDisplayChannel(this.formService.selectedChannels().join(','));
    readonly selectedRecipientNamesLabel = () => {
        const usersById = new Map<number, string>(this.users().map((user: UserDto) => [user.id, user.name] as const));
        const selectedNames = this.formService
            .selectedUserIds()
            .map((userId) => usersById.get(userId))
            .filter((name): name is string => typeof name === 'string' && name.trim().length > 0);

        return selectedNames.length > 0 ? selectedNames.join(', ') : `${this.formService.selectedUserIds().length} người đã chọn`;
    };

    ngOnInit(): void {
        this.campaignQuery.loadTemplates().subscribe();
    }

    setOnCreatedCallback(callback: ((campaign: CampaignCreateResponse) => void) | null): void {
        this.onCreatedCallback = callback;
    }

    onSubmitCampaign(): void {
        this.formService.setIsSubmitting(true);
        this.formService.setSubmitError('');
        this.formService.setSubmitSuccess(null);

        const requestData = this.formService.buildCreateRequest();

        this.campaignQuery.createCampaign(requestData).subscribe({
            next: (response) => {
                this.formService.setSubmitSuccess(response);
                this.formService.setIsSubmitting(false);
                this.onCreatedCallback?.(response);
            },
            error: (error: unknown) => {
                this.formService.setSubmitError(error instanceof Error ? error.message : 'Không thể tạo chiến dịch. Vui lòng thử lại.');
                this.formService.setIsSubmitting(false);
            },
        });
    }

    onCampaignNameInput(event: Event): void {
        this.formService.setCampaignName(this.getInputValue(event));
    }

    onTargetTypeChange(event: Event): void {
        const value = this.getInputValue(event) as 'ALL' | 'ACTIVE' | 'INACTIVE' | 'SPECIFIC';
        this.formService.setTargetType(value);
        this.formService.setSubmitError('');

        if (value === 'SPECIFIC') {
            this.campaignQuery.searchUsers('', 0, 100).subscribe();
            return;
        }

        this.formService.setSelectedUserIds([]);
        this.formService.setRecipientSearchDraft('');
    }

    onRatePerHourInput(event: Event): void {
        this.formService.setRatePerHour(Number(this.getInputValue(event)) || 0);
    }

    onUserSearchInput(event: Event): void {
        this.formService.setUserSearch(this.getInputValue(event));
    }

    onTemplateSearchInput(event: Event): void {
        this.formService.setTemplateSearch(this.getInputValue(event));
    }

    onPushTitleInput(event: Event): void {
        this.formService.onPushTitleChange(this.getInputValue(event));
    }

    onPushBodyInput(event: Event): void {
        this.formService.onPushBodyChange(this.getInputValue(event));
    }

    onPushActionUrlInput(event: Event): void {
        this.formService.setPushActionUrl(this.getInputValue(event));
    }

    onScheduledTimeInput(event: Event): void {
        this.formService.setScheduledTime(this.getInputValue(event));
    }

    onEndTimeInput(event: Event): void {
        this.formService.setEndTime(this.getInputValue(event));
    }

    private getDisplayChannel(channel: string): string {
        const channels = this.getChannelValues(channel);
        if (channels.length === 0) {
            return '-';
        }

        return channels
            .map((value) => (value === 'PUSH' ? 'Push' : value === 'EMAIL' ? 'Email' : value === 'SMS' ? 'Message' : value))
            .join(', ');
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

    private getInputValue(event: Event): string {
        return (event.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null)?.value ?? '';
    }
}
