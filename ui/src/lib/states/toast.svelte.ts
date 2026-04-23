type ToastType = 'success' | 'error' | 'info';

interface Toast {
	id: string;
	message: string;
	type: ToastType;
}

class ToastState {
	toasts = $state<Toast[]>([]);

	private add(message: string, type: ToastType) {
		const id = `${Date.now()}-${Math.random()}`;
		this.toasts = [...this.toasts, { id, message, type }];
		setTimeout(() => this.dismiss(id), 4000);
	}

	success(message: string) { this.add(message, 'success'); }
	error(message: string) { this.add(message, 'error'); }
	info(message: string) { this.add(message, 'info'); }

	dismiss(id: string) {
		this.toasts = this.toasts.filter((t) => t.id !== id);
	}
}

export const toastState = new ToastState();
