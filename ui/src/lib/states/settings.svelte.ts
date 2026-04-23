import { pb } from '$lib/pocketbase';

class SettingsState {
	bakery = $state<any>({
		name: 'TinAPPay Bakery',
		description: '',
		receipt_footer: '',
		logo: null
	});
	loading = $state(false);

	async load() {
		this.loading = true;
		try {
			const records = await pb.collection('bakery_info').getFullList();
			if (records.length > 0) this.bakery = { ...records[0] };
		} catch (err) {
			console.error('Settings load error:', err);
		} finally {
			this.loading = false;
		}
	}

	async save() {
		this.loading = true;
		try {
			const formData = new FormData();
			formData.append('name', this.bakery.name);
			formData.append('description', this.bakery.description ?? '');
			formData.append('receipt_footer', this.bakery.receipt_footer ?? '');
			if (this.bakery.logo instanceof File) {
				formData.append('logo', this.bakery.logo);
			}
			if (this.bakery.id) {
				await pb.collection('bakery_info').update(this.bakery.id, formData);
			} else {
				const record = await pb.collection('bakery_info').create(formData);
				this.bakery.id = record.id;
			}
		} finally {
			this.loading = false;
		}
	}
}

export const settingsState = new SettingsState();
