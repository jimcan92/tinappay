import { pb } from '$lib/pocketbase';
import { branchesState } from './branches.svelte';

export type FinancePeriod = 'today' | 'week' | 'month' | 'all';

class FinanceState {
	records = $state<any[]>([]);
	loading = $state(false);
	period = $state<FinancePeriod>('month');

	constructor() {
		if (typeof window !== 'undefined') {
			pb.collection('finances').subscribe('*', () => {
				this.load();
			}).catch(err => console.error('Finances subscription error:', err));
		}
	}

	get totalRevenue() {
		return this.records.filter((f) => f.type === 'revenue').reduce((acc, f) => acc + f.amount, 0);
	}

	get totalExpense() {
		return this.records.filter((f) => f.type === 'expense').reduce((acc, f) => acc + f.amount, 0);
	}

	get netProfit() {
		return this.totalRevenue - this.totalExpense;
	}

	get revenueByCategory() {
		const map = new Map<string, number>();
		this.records.filter(f => f.type === 'revenue').forEach(f => {
			const cat = f.category || 'others';
			map.set(cat, (map.get(cat) || 0) + f.amount);
		});
		return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
	}

	get expenseByCategory() {
		const map = new Map<string, number>();
		this.records.filter(f => f.type === 'expense').forEach(f => {
			const cat = f.category || 'others';
			map.set(cat, (map.get(cat) || 0) + f.amount);
		});
		return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
	}

	async load() {
		this.loading = true;
		try {
			const branch = branchesState.selectedBranchId;
			const filters: string[] = [];

			if (branch) {
				filters.push(`branch="${branch}"`);
			}

			const now = new Date();
			if (this.period === 'today') {
				const start = new Date(now);
				start.setHours(0, 0, 0, 0);
				filters.push(`date >= "${start.toISOString()}"`);
			} else if (this.period === 'week') {
				const start = new Date(now);
				start.setDate(now.getDate() - now.getDay()); // Sunday
				start.setHours(0, 0, 0, 0);
				filters.push(`date >= "${start.toISOString()}"`);
			} else if (this.period === 'month') {
				const start = new Date(now.getFullYear(), now.getMonth(), 1);
				filters.push(`date >= "${start.toISOString()}"`);
			}

			const filter = filters.join(' && ');
			this.records = await pb.collection('finances').getFullList({
				filter,
				sort: '-date',
				expand: 'branch',
				requestKey: 'finance-list'
			});
		} catch (err: any) {
			if (err?.isAbort) return;
			console.error('Finance load error:', err);
		} finally {
			this.loading = false;
		}
	}

	setPeriod(p: FinancePeriod) {
		this.period = p;
		this.load();
	}

	async addExpense(amount: number, description: string, category: string = 'others') {
		const branch = branchesState.selectedBranchId;
		await pb.collection('finances').create({
			branch: branch || null,
			type: 'expense',
			amount,
			description,
			category,
			date: new Date().toISOString()
		});
		await this.load();
	}
}

export const financeState = new FinanceState();

// Reactive auto-reload for Finance when branch switches
$effect.root(() => {
	$effect(() => {
		financeState.load();
	});
});
