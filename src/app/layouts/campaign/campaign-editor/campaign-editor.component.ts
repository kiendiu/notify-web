import { ChangeDetectionStrategy, Component, Input, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CampaignCreateResponse } from '../../../managements/models/campaigns.model';
import { CampaignEditorController } from './campaign-editor.controller';

@Component({
    selector: 'app-campaign-editor',
    standalone: true,
    imports: [CommonModule],
    providers: [CampaignEditorController],
    templateUrl: './campaign-editor.html',
    styleUrl: './campaign-editor.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampaignEditorComponent implements OnInit {
    private readonly campaignEditorController = inject(CampaignEditorController);

    @Input() onBack: (() => void) | null = null;

    private _onCreated: ((campaign: CampaignCreateResponse) => void) | null = null;

    @Input()
    set onCreated(value: ((campaign: CampaignCreateResponse) => void) | null) {
        this._onCreated = value;
        this.campaignEditorController.setOnCreatedCallback(value);
    }

    get onCreated(): ((campaign: CampaignCreateResponse) => void) | null {
        return this._onCreated;
    }

    readonly formService = this.campaignEditorController.formService;
    readonly pushPreview = this.campaignEditorController.pushPreview;
    readonly emailPreview = this.campaignEditorController.emailPreview;
    readonly templates = this.campaignEditorController.templates;
    readonly users = this.campaignEditorController.users;
    readonly filteredTemplates = this.campaignEditorController.filteredTemplates;
    readonly filteredUsers = this.campaignEditorController.filteredUsers;
    readonly selectedChannelsLabel = this.campaignEditorController.selectedChannelsLabel;
    readonly selectedRecipientNamesLabel = this.campaignEditorController.selectedRecipientNamesLabel;

    ngOnInit(): void {
        this.campaignEditorController.ngOnInit();
    }

    handleBack(): void {
        this.onBack?.();
    }

    onSubmitCampaign(): void {
        this.campaignEditorController.onSubmitCampaign();
    }

    onCampaignNameInput(event: Event): void {
        this.campaignEditorController.onCampaignNameInput(event);
    }

    onTargetTypeChange(event: Event): void {
        this.campaignEditorController.onTargetTypeChange(event);
    }

    onRatePerHourInput(event: Event): void {
        this.campaignEditorController.onRatePerHourInput(event);
    }

    onUserSearchInput(event: Event): void {
        this.campaignEditorController.onUserSearchInput(event);
    }

    onTemplateSearchInput(event: Event): void {
        this.campaignEditorController.onTemplateSearchInput(event);
    }

    onPushTitleInput(event: Event): void {
        this.campaignEditorController.onPushTitleInput(event);
    }

    onPushBodyInput(event: Event): void {
        this.campaignEditorController.onPushBodyInput(event);
    }

    onPushActionUrlInput(event: Event): void {
        this.campaignEditorController.onPushActionUrlInput(event);
    }

    onScheduledTimeInput(event: Event): void {
        this.campaignEditorController.onScheduledTimeInput(event);
    }

    onEndTimeInput(event: Event): void {
        this.campaignEditorController.onEndTimeInput(event);
    }
}
