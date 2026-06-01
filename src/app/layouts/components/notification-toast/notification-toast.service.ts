import { Injectable, signal } from '@angular/core';

export type NotificationToastStatus = 'success' | 'error' | 'info' | 'warning';

export interface NotificationToastState {
	id: number;
	status: NotificationToastStatus | string;
	message: string;
	callback?: () => void;
}

@Injectable()
export class NotificationService {
	private readonly toastState = signal<NotificationToastState | null>(null);
	private nextToastId = 0;
	private toastTimer: ReturnType<typeof setTimeout> | null = null;

	readonly toast = this.toastState.asReadonly();

	show(
		status: NotificationToastStatus | string,
		message: string,
		callback?: () => void,
		durationMs = 1800,
	): void {
		this.clearTimer();
		const toastId = ++this.nextToastId;
		this.toastState.set({
			id: toastId,
			status,
			message,
			callback,
		});

		if (durationMs > 0) {
			this.toastTimer = setTimeout(() => this.dismiss(toastId), durationMs);
		}
	}

	dismiss(toastId?: number): void {
		const current = this.toastState();
		if (!current) {
			return;
		}
		if (toastId != null && current.id !== toastId) {
			return;
		}

		this.clearTimer();
		this.toastState.set(null);
		current.callback?.();
	}

	private clearTimer(): void {
		if (this.toastTimer == null) {
			return;
		}
		clearTimeout(this.toastTimer);
		this.toastTimer = null;
	}
}