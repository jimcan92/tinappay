import { pb } from '$lib/pocketbase';
import { toastState } from './toast.svelte';

export type NotificationType = 'pr_created' | 'pr_updated' | 'user_pending' | 'low_stock';

export interface Notification {
	id: string;
	recipient: string;
	type: NotificationType;
	title: string;
	body: string;
	href: string;
	read: boolean;
	created: string;
	branch_name?: string;
}

class NotificationsState {
	items = $state<Notification[]>([]);
	loading = $state(false);
	#subscribed = false;

	unreadCount = $derived(this.items.filter((n) => !n.read).length);

	async load() {
		// Auth is loaded by the parent layout's onMount, which runs AFTER children.
		// Explicitly load from cookie here so we don't depend on that ordering.
		if (typeof document !== 'undefined') {
			pb.authStore.loadFromCookie(document.cookie);
		}
		if (!pb.authStore.isValid || !pb.authStore.record?.id) return;

		const userId = pb.authStore.record.id;

		// Set up real-time subscription once, now that we have a valid user ID.
		if (!this.#subscribed) {
			this.#subscribed = true;
			pb.collection('notifications')
				.subscribe<Notification>(
					'*',
					(e) => {
						if (e.action === 'create') {
							this.items = [e.record, ...this.items];
							toastState.info(e.record.title);
						} else if (e.action === 'update') {
							this.items = this.items.map((n) => (n.id === e.record.id ? e.record : n));
						} else if (e.action === 'delete') {
							this.items = this.items.filter((n) => n.id !== e.record.id);
						}
					},
					{ filter: `recipient = "${userId}"` }
				)
				.catch((err) => console.error('Notifications subscription error:', err));
		}

		this.loading = true;
		try {
			const result = await pb.collection('notifications').getList<Notification>(1, 50, {
				filter: `recipient = "${userId}"`,
				sort: '-created',
				requestKey: 'notifications-list'
			});
			this.items = result.items;
		} catch (err: any) {
			if (err?.isAbort) return;
			console.error('Notifications load error:', err);
		} finally {
			this.loading = false;
		}
	}

	async markRead(id: string) {
		try {
			await pb.collection('notifications').update(id, { read: true });
			this.items = this.items.map((n) => (n.id === id ? { ...n, read: true } : n));
		} catch (err) {
			console.error('Mark read error:', err);
		}
	}

	async markAllRead() {
		const unread = this.items.filter((n) => !n.read);
		await Promise.all(unread.map((n) => this.markRead(n.id)));
	}

	typeIcon(type: NotificationType): string {
		const icons: Record<NotificationType, string> = {
			pr_created: 'inventory',
			pr_updated: 'package_2',
			user_pending: 'person_add',
			low_stock: 'warning'
		};
		return icons[type] ?? 'notifications';
	}

	typeColor(type: NotificationType): string {
		const colors: Record<NotificationType, string> = {
			pr_created: 'text-primary',
			pr_updated: 'text-success',
			user_pending: 'text-secondary',
			low_stock: 'text-warning'
		};
		return colors[type] ?? 'text-on-surface-variant';
	}
}

export const notificationsState = new NotificationsState();
