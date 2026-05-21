import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Actions, ofType } from '@ngrx/effects';

import * as PreviewActions from '../../management/stores/preview/preview.actions';
import {
	selectPushPreview,
	selectEmailPreview,
	selectTemplates,
	selectUsers,
} from '../../management/stores/preview/preview.selectors';
import { CampaignSearchResponse, CampaignSummary } from '../../management/models/campaign.model';
import { CampaignFormService } from '../../services/campaign-form.service';
import { NotificationService } from '../../core/services/notification.service';
import { CampaignListComponent } from './campaign-list/campaign-list.component';
import { CampaignPreviewComponent } from './campaign-preview/campaign-preview.component';
import { CampaignNotificationComponent } from './campaign-notification/campaign-notification.component';
import * as CampaignActions from '../../management/stores/campaign/campaign.actions';

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
	private readonly store = inject(Store);
	private readonly destroyRef = inject(DestroyRef);
	private readonly actions$ = inject(Actions);
	private readonly notificationService = inject(NotificationService);
	readonly formService = inject(CampaignFormService);

	readonly view = signal<'list' | 'create' | 'notifications'>('list');
	readonly selectedCampaign = signal<CampaignSummary | null>(null);
	readonly pendingCreatedCampaignName = signal<string | null>(null);
	readonly awaitingCreatedCampaignOpen = signal(false);
	readonly notificationComponent = CampaignNotificationComponent;
	readonly handleNotificationBack = (): void => {
		this.showList();
	};

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

	readonly filteredTemplates = computed(() => {
		const q = this.formService.templateSearch().trim().toLowerCase();
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
		const q = this.formService.userSearch().trim().toLowerCase();
		if (!q) {
			return this.users();
		}
		return this.users().filter((user) => {
			const haystack = (user.name + ' ' + user.email).toLowerCase();
			return haystack.includes(q);
		});
	});

	readonly selectedChannelsLabel = computed(() =>
		this.getDisplayChannel(this.formService.selectedChannels().join(',')),
	);

	readonly selectedRecipientNamesLabel = computed(() => {
		const usersById = new Map(
			this.users().map((user) => [user.id, user.name]),
		);
		const selectedNames = this.formService.selectedUserIds()
			.map((userId) => usersById.get(userId))
			.filter((name): name is string => Boolean(name && name.trim()));
		if (selectedNames.length > 0) {
			return selectedNames.join(', ');
		}
		return `${this.formService.selectedUserIds().length} người đã chọn`;
	});

	ngOnInit(): void {
		this.store.dispatch(PreviewActions.loadTemplates());

		this.actions$
			.pipe(ofType(CampaignActions.createCampaignSuccess), takeUntilDestroyed(this.destroyRef))
			.subscribe(({ request }) => {
				this.formService.isSubmitting.set(false);
				this.pendingCreatedCampaignName.set(request.name.trim());
				this.awaitingCreatedCampaignOpen.set(true);
				this.notificationService.show('success', 'Tạo chiến dịch thành công.', () => {
					this.store.dispatch(CampaignActions.loadCampaigns());
				});
			});

		this.actions$
			.pipe(ofType(CampaignActions.createCampaignFailure), takeUntilDestroyed(this.destroyRef))
			.subscribe(({ errorMessage }) => {
				this.formService.isSubmitting.set(false);
				this.formService.submitError.set(errorMessage ?? 'Không thể tạo chiến dịch. Vui lòng thử lại.');
				this.awaitingCreatedCampaignOpen.set(false);
				this.pendingCreatedCampaignName.set(null);
				this.notificationService.show('error', errorMessage ?? 'Không thể tạo chiến dịch. Vui lòng thử lại.');
			});

		this.actions$
			.pipe(ofType(CampaignActions.loadCampaignsSuccess), takeUntilDestroyed(this.destroyRef))
			.subscribe(({ response }) => {
				if (!this.awaitingCreatedCampaignOpen()) {
					return;
				}

				const pendingName = this.pendingCreatedCampaignName();
				if (!pendingName) {
					return;
				}

				const createdCampaign = this.findCreatedCampaign(response, pendingName);
				if (!createdCampaign) {
					return;
				}

				this.pendingCreatedCampaignName.set(null);
				this.awaitingCreatedCampaignOpen.set(false);
				this.openCampaignNotifications(createdCampaign);
			});
	}

	showList(): void {
		this.view.set('list');
		this.selectedCampaign.set(null);
		this.pendingCreatedCampaignName.set(null);
		this.awaitingCreatedCampaignOpen.set(false);
		this.store.dispatch(PreviewActions.clearPreview());
		this.formService.resetFormState();
	}

	showCreate(): void {
		this.view.set('create');
		this.store.dispatch(PreviewActions.loadTemplates());
		this.selectedCampaign.set(null);
		this.pendingCreatedCampaignName.set(null);
		this.awaitingCreatedCampaignOpen.set(false);
	}

	showCampaignNotifications(campaign: CampaignSummary): void {
		this.openCampaignNotifications(campaign);
	}

	trackByTemplateId(_: number, template: { templateName: string }): string {
		return template.templateName;
	}

	trackByUserId(_: number, user: { id: number }): number {
		return user.id;
	}

	private getDisplayChannel(channel: string): string {
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
			.map((item) => item.trim().toUpperCase())
			.filter((item) => item.length > 0);
	}

	private openCampaignNotifications(campaign: CampaignSummary): void {
		this.formService.resetFormState();
		this.selectedCampaign.set(campaign);
		this.view.set('notifications');
	}

	private findCreatedCampaign(
		response: CampaignSearchResponse,
		campaignName: string,
	): CampaignSummary | null {
		const items = response.content ?? response.items ?? response.data ?? [];
		const normalizedName = campaignName.trim().toLowerCase();
		const matchingItems = items.filter((item) => item.name.trim().toLowerCase() === normalizedName);
		if (matchingItems.length === 0) {
			return null;
		}

		return [...matchingItems].sort((left, right) => {
			const leftTime = new Date(left.createdAt || 0).getTime();
			const rightTime = new Date(right.createdAt || 0).getTime();
			return rightTime - leftTime;
		})[0] ?? null;
	}
}