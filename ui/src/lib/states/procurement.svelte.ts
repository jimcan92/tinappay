import { pb } from '$lib/pocketbase';
import { branchesState } from './branches.svelte';

class ProcurementState {
	supplies = $state<any[]>([]);
	suppliers = $state<any[]>([]);
	purchaseRequests = $state<any[]>([]);
	branchStocks = $state<any[]>([]);
	loading = $state(true);
	processing = $state(false);

	constructor() {
		if (typeof window !== 'undefined') {
			const update = () => this.load();
			pb.collection('supplies').subscribe('*', update).catch(e => console.error('Supplies sub error:', e));
			pb.collection('suppliers').subscribe('*', update).catch(e => console.error('Suppliers sub error:', e));
			pb.collection('purchase_requests').subscribe('*', update).catch(e => console.error('PR sub error:', e));
			pb.collection('branch_stocks').subscribe('*', update).catch(e => console.error('Branch stocks sub error:', e));
		}
	}

	get lowStockSupplies() {
		return this.supplies.filter((s) => this.getBranchStock(s) <= (s.min_stock || 0));
	}

	get inFlightRequests() {
		return this.purchaseRequests.filter((pr) => pr.status !== 'received');
	}

	get historyRequests() {
		return this.purchaseRequests.filter((pr) => pr.status === 'received');
	}

	get stats() {
		const critical = this.supplies.filter((s) => this.getStockStatus(s) === 'critical').length;
		const low = this.supplies.filter((s) => this.getStockStatus(s) === 'low').length;
		const pending = this.purchaseRequests.filter((pr) => pr.status === 'pending').length;
		const inTransit = this.purchaseRequests.filter((pr) => pr.status === 'approved').length;
		return { critical, low, pending, inTransit };
	}

	getBranchStock(supply: any): number {
		const bs = this.branchStocks.find((b) => b.supply === supply.id);
		return bs ? bs.quantity : 0;
	}

	getStockPercentage(supply: any): number {
		const current = this.getBranchStock(supply);
		return Math.round(Math.min(Math.max((current / (supply.max_stock || 1)) * 100, 0), 100));
	}

	getStockStatus(supply: any): 'critical' | 'low' | 'ok' {
		const current = this.getBranchStock(supply);
		const min = supply.min_stock || 0;
		if (current <= min) return 'critical';
		if (current <= min * 1.5) return 'low';
		return 'ok';
	}

	getSuggestedReorder(supply: any): number {
		const current = this.getBranchStock(supply);
		const max = supply.max_stock || 0;
		return Math.max(0, max - current);
	}

	async load() {
		this.loading = true;
		const branch = branchesState.selectedBranchId;

		// Run each query independently so one failure (e.g. restrictive collection rule)
		// doesn't blank the rest of the page.
		const [suppliesRes, suppliersRes, prsRes, stocksRes] = await Promise.allSettled([
			pb.collection('supplies').getFullList({ sort: 'name', expand: 'category,supplier', requestKey: 'procurement-supplies' }),
			pb.collection('suppliers').getFullList({ sort: 'name', requestKey: 'procurement-suppliers' }),
			pb.collection('purchase_requests').getFullList({
				filter: branch ? `branch="${branch}"` : '',
				sort: '-created',
				expand: 'supplies,supplies.supplier,requested_by',
                requestKey: 'procurement-prs'
			}),
			branch
				? pb.collection('branch_stocks').getFullList({ filter: `branch="${branch}"`, requestKey: 'procurement-stocks' })
				: Promise.resolve([])
		]);

		if (suppliesRes.status === 'fulfilled') this.supplies = suppliesRes.value;
		else if (suppliesRes.reason?.isAbort) { /* ignore */ }
        else console.error('Supplies load error:', suppliesRes.reason);

		if (suppliersRes.status === 'fulfilled') this.suppliers = suppliersRes.value;
        else if (suppliersRes.reason?.isAbort) { /* ignore */ }
		else console.error('Suppliers load error:', suppliersRes.reason);

		if (prsRes.status === 'fulfilled') this.purchaseRequests = prsRes.value;
        else if (prsRes.reason?.isAbort) { /* ignore */ }
		else console.error('Purchase requests load error:', prsRes.reason);

		if (stocksRes.status === 'fulfilled') this.branchStocks = stocksRes.value;
        else if (stocksRes.reason?.isAbort) { /* ignore */ }
		else console.error('Branch stocks load error:', stocksRes.reason);

		this.loading = false;
	}

	async submitRequest(supplyId: string, quantity: number) {
		this.processing = true;
		try {
			const branch = branchesState.selectedBranchId;
			await pb.collection('purchase_requests').create({
				branch: branch || null,
				supplies: supplyId,
				quantity,
				status: 'pending',
				requested_by: pb.authStore.record?.id
			});
			await this.load();
		} finally {
			this.processing = false;
		}
	}

	async approveRequest(pr: any) {
		this.processing = true;
		try {
			await pb.collection('purchase_requests').update(pr.id, { status: 'approved' });
			await this.load();
		} finally {
			this.processing = false;
		}
	}

	async receivePR(pr: any) {
		this.processing = true;
		try {
			await pb.collection('purchase_requests').update(pr.id, { status: 'received' });

			if (pr.branch) {
				const existing = this.branchStocks.find((bs) => bs.supply === pr.supplies && bs.branch === pr.branch);
				if (existing) {
					await pb.collection('branch_stocks').update(existing.id, { quantity: existing.quantity + pr.quantity });
				} else {
					await pb.collection('branch_stocks').create({ branch: pr.branch, supply: pr.supplies, quantity: pr.quantity });
				}
			}

			await pb.collection('inventory_logs').create({
				supply: pr.supplies,
				quantity: pr.quantity,
				reason: 'restock',
				user: pb.authStore.record?.id
			});

			// Record in Finance
			try {
				const supply = this.supplies.find(s => s.id === pr.supplies);
				const amount = (supply?.price || 0) * pr.quantity;
				if (amount > 0) {
					await pb.collection('finances').create({
						branch: pr.branch || null,
						type: 'expense',
						amount,
						category: 'supplies',
						description: `Procurement Receipt: ${supply?.name || 'Supplies'} (${pr.quantity} units)`,
						reference_id: pr.id,
						date: new Date().toISOString()
					});
				}
			} catch (e) {
				console.error("Finance recording failed during PR receive:", e);
			}

			await this.load();
		} finally {
			this.processing = false;
		}
	}
}

export const procurementState = new ProcurementState();

// Reactive auto-reload for Procurement when branch switches
$effect.root(() => {
	$effect(() => {
		procurementState.load();
	});
});
