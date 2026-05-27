import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { NotificationService, NotificationToastStatus } from './notification-toast.service';

@Component({
	selector: 'app-notification-toast',
	standalone: true,
	imports: [CommonModule],
	templateUrl: './notification-toast.component.html',
	styleUrl: './notification-toast.component.scss',
})
export class NotificationToastComponent {
	private readonly notificationService = inject(NotificationService);

	readonly toast = this.notificationService.toast;

	handleToastClick(): void {
		const current = this.toast();
		if (!current) {
			return;
		}
		this.notificationService.dismiss(current.id);
	}

	handleCloseClick(event: MouseEvent): void {
		event.stopPropagation();
		const current = this.toast();
		if (!current) {
			return;
		}
		this.notificationService.dismiss(current.id);
	}

	getIcon(status: NotificationToastStatus | string): string {
		switch (status) {
			case 'success':
				return 'fa-circle-check';
			case 'error':
				return 'fa-circle-xmark';
			case 'warning':
				return 'fa-triangle-exclamation';
			default:
				return 'fa-circle-info';
		}
	}

	getTitle(status: NotificationToastStatus | string): string {
		switch (status) {
			case 'success':
				return 'Thành công';
			case 'error':
				return 'Có lỗi';
			case 'warning':
				return 'Cảnh báo';
			default:
				return 'Thông báo';
		}
	}
}