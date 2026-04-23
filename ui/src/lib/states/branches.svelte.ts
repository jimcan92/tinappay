import { pb } from '$lib/pocketbase';

class BranchesState {
	items = $state<any[]>([]);
	currentBakeryId = $state('');

	constructor() {
		if (typeof window !== 'undefined') {
			pb.collection('branches').subscribe('*', () => {
				this.load();
			}).catch(err => console.error('Branches subscription error:', err));
		}
	}

	async load(bakeryId?: string) {
		if (bakeryId) this.currentBakeryId = bakeryId;
		try {
			const filter = this.currentBakeryId ? `bakery="${this.currentBakeryId}"` : '';
			try {
				this.items = await pb.collection('branches').getFullList({
					sort: 'name',
					expand: 'manager',
					...(filter && { filter })
				});
			} catch {
				// Fall back without filter/expand if schema fields don't exist yet
				this.items = await pb.collection('branches').getFullList({ sort: 'name' });
			}
		} catch (err) {
			console.error('Branches load error:', err);
		}
	}

	async create(name: string, location = '', phone = '', email = '', manager = '', lat?: number, lng?: number) {
		await pb.collection('branches').create({
			name, location, phone, email,
			...(manager && { manager }),
			...(this.currentBakeryId && { bakery: this.currentBakeryId }),
			...(lat !== undefined && { lat }),
			...(lng !== undefined && { lng })
		});
		await this.load();
	}

	async update(id: string, name: string, location = '', phone = '', email = '', manager = '', lat?: number, lng?: number) {
		await pb.collection('branches').update(id, {
			name, location, phone, email,
			manager: manager || null,
			...(this.currentBakeryId && { bakery: this.currentBakeryId }),
			lat: lat ?? null,
			lng: lng ?? null
		});
		await this.load();
	}

	async delete(id: string) {
		await pb.collection('branches').delete(id);
		await this.load();
	}

	async assignUserBranch(userId: string, branchId: string) {
		await pb.collection('users').update(userId, { branch: branchId });
	}

	// Global selection state
	#selectedBranchId = $state(pb.authStore.record?.branch || '');

	get selectedBranchId() {
		return this.#selectedBranchId;
	}

	set selectedBranchId(id: string) {
		this.#selectedBranchId = id;
	}
}

export const branchesState = new BranchesState();
