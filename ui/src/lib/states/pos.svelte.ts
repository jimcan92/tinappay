import { pb } from '$lib/pocketbase';
import { branchesState } from './branches.svelte';

class PosState {
	categories = $state<any[]>([]);
	products = $state<any[]>([]);
	currentBranch = $state<any>(null);
	loading = $state(false);

	constructor() {
		if (typeof window !== 'undefined') {
			const update = () => this.load();
			pb.collection('categories').subscribe('*', update).catch(e => console.error('Categories sub error (pos):', e));
			pb.collection('products').subscribe('*', update).catch(e => console.error('Products sub error (pos):', e));
			pb.collection('branch_stocks').subscribe('*', update).catch(e => console.error('Branch stocks sub error (pos):', e));
		}
	}

	async load() {
		this.loading = true;
		try {
			const [catList, prodList] = await Promise.all([
				pb.collection('categories').getFullList({ filter: 'type="product"' }).catch(() =>
					pb.collection('categories').getFullList()
				),
				pb.collection('products').getFullList({ expand: 'category', sort: 'name' })
			]);

			const branchId = branchesState.selectedBranchId;
			let mapped = prodList;

			if (branchId) {
				try {
					const [branch, branchStocks] = await Promise.all([
						pb.collection('branches').getOne(branchId),
						pb.collection('branch_stocks').getFullList({ filter: `branch="${branchId}"` })
					]);
					this.currentBranch = branch;
					mapped = prodList.map((p) => {
						const bs = branchStocks.find((s: any) => s.product === p.id);
						return { ...p, branch_stock: bs ? bs.quantity : 0 };
					});
				} catch {
					mapped = prodList.map((p) => ({ ...p, branch_stock: 0 }));
				}
			} else {
				mapped = prodList.map((p) => ({ ...p, branch_stock: 0 }));
			}

			this.categories = catList;
			this.products = mapped;
		} catch (err) {
			console.error('POS load error:', err);
		} finally {
			this.loading = false;
		}
	}
}

export const posState = new PosState();

// Reactive auto-reload for POS when branch switches
$effect.root(() => {
	$effect(() => {
		if (branchesState.selectedBranchId) {
			posState.load();
		}
	});
});
