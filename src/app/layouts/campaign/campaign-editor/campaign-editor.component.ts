import { ChangeDetectionStrategy, Component, computed, inject, input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CampaignEditorService } from '../../../data/services/campaign-editor.service';
import { CampaignEditorStateService } from '../../../managements/states/campaign-editor.state';

@Component({
	selector: 'app-campaign-editor',
	standalone: true,
	imports: [CommonModule],
	templateUrl: './campaign-editor.html',
	styleUrl: './campaign-editor.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampaignEditorComponent implements OnInit {
	readonly formService: CampaignEditorService = inject(CampaignEditorService);
	private readonly campaignEditorState = inject(CampaignEditorStateService);
	readonly onBack = input<(() => void) | null>(null);

	readonly pushPreview = this.campaignEditorState.pushPreview;
	readonly emailPreview = this.campaignEditorState.emailPreview;
	readonly templates = this.campaignEditorState.templates;
	readonly users = this.campaignEditorState.users;

	readonly filteredTemplates = computed(() => {
		const q = this.formService.templateSearch().trim().toLowerCase();
		if (!q) {
			return this.templates();
		}
		return this.templates().filter((template) => {
			const haystack = (template.templateName + ' ' + (template.subject || '') + ' ' + (template.content || '')).toLowerCase();
			return haystack.includes(q);
		});
	});

	readonly filteredUsers = computed(() => {
		const q = this.formService.userSearch().trim().toLowerCase();
		if (!q) {
			return this.users();
		}
		return this.users().filter((user) => (user.name + ' ' + user.email).toLowerCase().includes(q));
	});

	readonly selectedChannelsLabel = computed(() => this.getDisplayChannel(this.formService.selectedChannels().join(',')));
	readonly selectedRecipientNamesLabel = computed(() => {
		const usersById = new Map(this.users().map((user) => [user.id, user.name]));
		const selectedNames = this.formService.selectedUserIds().map((userId) => usersById.get(userId)).filter((name): name is string => Boolean(name && name.trim()));
		return selectedNames.length > 0 ? selectedNames.join(', ') : `${this.formService.selectedUserIds().length} người đã chọn`;
	});

	ngOnInit(): void {
		this.formService.loadTemplates();
	}

	onCampaignNameInput(event: Event): void {
		this.formService.campaignName.set(this.getInputValue(event));
	}

	onTargetTypeChange(event: Event): void {
		this.formService.onTargetTypeChange(this.getInputValue(event));
	}

	onRatePerHourInput(event: Event): void {
		this.formService.ratePerHour.set(Number(this.getInputValue(event)) || 0);
	}

	onUserSearchInput(event: Event): void {
		this.formService.userSearch.set(this.getInputValue(event));
	}

	onTemplateSearchInput(event: Event): void {
		this.formService.templateSearch.set(this.getInputValue(event));
	}

	onPushTitleInput(event: Event): void {
		this.formService.onPushTitleChange(this.getInputValue(event));
	}

	onPushBodyInput(event: Event): void {
		this.formService.onPushBodyChange(this.getInputValue(event));
	}

	onPushActionUrlInput(event: Event): void {
		this.formService.pushActionUrl.set(this.getInputValue(event));
	}

	onScheduledTimeInput(event: Event): void {
		this.formService.scheduledTime.set(this.getInputValue(event));
	}

	onEndTimeInput(event: Event): void {
		this.formService.endTime.set(this.getInputValue(event));
	}

	private getDisplayChannel(channel: string): string {
		const channels = this.getChannelValues(channel);
		if (channels.length === 0) {
			return '-';
		}
		return channels.map((value) => (value === 'PUSH' ? 'Push' : value === 'EMAIL' ? 'Email' : value === 'SMS' ? 'Message' : value)).join(', ');
	}

	private getChannelValues(channel: string): string[] {
		if (!channel) {
			return [];
		}
		return channel.split(',').map((item) => item.trim().toUpperCase()).filter((item) => item.length > 0);
	}

	private getInputValue(event: Event): string {
		return (event.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null)?.value ?? '';
	}
}