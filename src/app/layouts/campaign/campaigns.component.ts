import { ChangeDetectionStrategy, Component, DestroyRef, Injector, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CampaignSummary } from '../../managements/models/campaigns.model';
import { CampaignEditorQuery } from '../../managements/queries/campaign-editor.query';
import { CampaignEditorService } from '../../data/services/campaign-editor.service';
import { CampaignEditorState } from '../../managements/states/campaign-editor.state';
import { CampaignsController } from './campaigns.controller';
import { CampaignsQuery } from '../../managements/queries/campaigns.query';
import { CampaignsStateService } from '../../managements/states/campaigns.state';
import { CampaignEditorComponent } from './campaign-editor/campaign-editor.component';
import { NotificationsComponent } from './notifications/notifications.component';
import { NotificationsQuery } from '../../managements/queries/notifications.query';
import { NotificationsStateService } from '../../managements/states/notifications.state';
import { UiStateService } from '../../core/stores/state/ui-state.service';

@Component({
	selector: 'app-campaigns',
	standalone: true,
	imports: [CommonModule],
	providers: [CampaignsController, CampaignsQuery, CampaignsStateService, CampaignEditorService, CampaignEditorQuery, CampaignEditorState, NotificationsQuery, NotificationsStateService, UiStateService],
	templateUrl: './campaigns.html',
	styleUrl: './campaigns.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampaignsComponent implements OnInit {
	private readonly destroyRef = inject(DestroyRef);
	private readonly injector = inject(Injector);
	private readonly campaignsController = inject(CampaignsController);

	readonly formService = this.campaignsController.formService;
	readonly view = this.campaignsController.view;
	readonly selectedCampaign = this.campaignsController.selectedCampaign;
	readonly editorComponent = CampaignEditorComponent;
	readonly notificationComponent = NotificationsComponent;
	readonly campaigns = this.campaignsController.campaigns;
	readonly page = this.campaignsController.page;
	readonly loading = this.campaignsController.loading;
	readonly errorMessage = this.campaignsController.errorMessage;
	readonly filters = this.campaignsController.filters;
	readonly pageNumbers = this.campaignsController.pageNumbers;
	readonly hasNoCampaigns = this.campaignsController.hasNoCampaigns;
	readonly handleNotificationBack = this.campaignsController.handleNotificationBack;
	readonly handleEditorBack = this.campaignsController.handleEditorBack;
	readonly handleCampaignCreated = this.campaignsController.handleCampaignCreated;

	ngOnInit(): void {
		this.campaignsController.init(this.destroyRef, this.injector);
	}

	showList(): void {
		this.campaignsController.showList();
	}

	showEditor(): void {
		this.campaignsController.showEditor();
	}

	reloadList(): void {
		this.campaignsController.reloadList();
	}

	updateStatus(status: string): void {
		this.campaignsController.updateStatus(status);
	}

	updateSortDirection(sortDirection: string): void {
		this.campaignsController.updateSortDirection(sortDirection);
	}

	updateRowsPerPage(size: string): void {
		this.campaignsController.updateRowsPerPage(size);
	}

	goToPage(page: number): void {
		this.campaignsController.goToPage(page);
	}

	showCampaignNotifications(campaign: CampaignSummary): void {
		this.campaignsController.showCampaignNotifications(campaign);
	}

	trackByCampaignId(_: number, campaign: CampaignSummary): string {
		return this.campaignsController.trackByCampaignId(_, campaign);
	}

	formatDate(value: string | null | undefined): string {
		return this.campaignsController.formatDate(value);
	}

	getDisplayStatus(status: string): string {
		return this.campaignsController.getDisplayStatus(status);
	}

	channelIcon(channel: string): string {
		return this.campaignsController.channelIcon(channel);
	}

	getChannelBadgeClass(channel: string): string {
		return this.campaignsController.getChannelBadgeClass(channel);
	}

	getStatusDotColor(status: string): string {
		return this.campaignsController.getStatusDotColor(status);
	}

	getStatusTextStyleColor(status: string): string {
		return this.campaignsController.getStatusTextStyleColor(status);
	}

	trackByTemplateId(_: number, template: { templateName: string }): string {
		return template.templateName;
	}

	trackByUserId(_: number, user: { id: number }): number {
		return user.id;
	}

	getDisplayChannel(channel: string): string {
 		return this.campaignsController.getDisplayChannel(channel);
	}
}