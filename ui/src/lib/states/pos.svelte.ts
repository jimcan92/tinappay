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
            const branchId = branchesState.selectedBranchId;

            // Fetch base data
			const [catList, prodList, salesData] = await Promise.all([
				pb.collection('categories').getFullList({ filter: 'type="product"', requestKey: 'pos-cats' }).catch(() =>
					pb.collection('categories').getFullList({ requestKey: 'pos-cats-fallback' })
				),
				pb.collection('products').getFullList({ expand: 'category', sort: 'name', requestKey: 'pos-prods' }),
                // Get popularity (last 30 days)
                pb.collection('order_items').getFullList({ 
                    fields: 'product',
                    filter: `created >= "${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()}"`,
                    requestKey: 'pos-popularity' 
                }).catch(() => [])
			]);

            // Compute popularity map
            const popularityMap = new Map<string, number>();
            salesData.forEach(item => {
                popularityMap.set(item.product, (popularityMap.get(item.product) || 0) + 1);
            });

			let mapped = prodList;

			if (branchId) {
				try {
					const [branch, branchStocks] = await Promise.all([
						pb.collection('branches').getOne(branchId, { requestKey: 'pos-branch-info' }),
						pb.collection('branch_stocks').getFullList({ filter: `branch="${branchId}"`, requestKey: 'pos-branch-stocks' })
					]);
					this.currentBranch = branch;
					mapped = prodList.map((p) => {
						const bs = branchStocks.find((s: any) => s.product === p.id);
						return { 
                            ...p, 
                            branch_stock: bs ? bs.quantity : 0,
                            popularity: popularityMap.get(p.id) || 0
                        };
					});
				} catch {
					mapped = prodList.map((p) => ({ ...p, branch_stock: 0, popularity: popularityMap.get(p.id) || 0 }));
				}
			} else {
				mapped = prodList.map((p) => ({ ...p, branch_stock: 0, popularity: popularityMap.get(p.id) || 0 }));
			}

            // SMART SORTING:
            // 1. In-stock items first
            // 2. Then by popularity (high to low)
            // 3. Finally alphabetical
            mapped.sort((a, b) => {
                const aInStock = (a.branch_stock || 0) > 0;
                const bInStock = (b.branch_stock || 0) > 0;

                // Priority 1: Stock availability
                if (aInStock && !bInStock) return -1;
                if (!aInStock && bInStock) return 1;

                // Priority 2: Popularity
                if ((b.popularity || 0) !== (a.popularity || 0)) {
                    return (b.popularity || 0) - (a.popularity || 0);
                }

                // Priority 3: Name
                return a.name.localeCompare(b.name);
            });

			this.categories = catList;
			this.products = mapped;
		} catch (err: any) {
            if (err?.isAbort) return;
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
