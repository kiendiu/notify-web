import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CampaignChannel } from '../../../management/models/campaign.model';
import { EmailPreview, PushPreview } from '../../../management/stores/preview/preview.state';

@Component({
	selector: 'app-campaign-preview',
	imports: [CommonModule],
	templateUrl: './campaign-preview.html',
	styleUrl: './campaign-preview.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampaignPreviewComponent {
	@Input() selectedChannels: CampaignChannel[] = [];
	@Input() pushPreview: PushPreview | null = null;
	@Input() emailPreview: EmailPreview | null = null;
}