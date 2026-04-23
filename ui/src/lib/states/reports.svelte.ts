import { pb } from '$lib/pocketbase';
import { branchesState } from './branches.svelte';

export interface DayData {
	label: string;
	revenue: number;
	expense: number;
	profit: number;
	fullDate: string;
}

export interface CatData {
	name: string;
	count: number;
	pct: number;
	offset: number;
}

export interface ItemSale {
    id: string;
    name: string;
    quantity: number;
    revenue: number;
    category: string;
}

function toFilterDate(d: Date) {
	return d.toISOString().replace('T', ' ').split('.')[0];
}

class ReportsState {
	loading = $state(true);
	
	// Sales Metrics
	totalRevenue = $state(0);
	orderCount = $state(0);
	avgTicket = $state(0);
	bestSeller = $state<any>(null);
	recentOrders = $state<any[]>([]);
    itemSales = $state<ItemSale[]>([]);
	
	// Finance Metrics
	totalExpense = $state(0);
	netProfit = $state(0);
	
	// Inventory Metrics
	inventoryValue = $state(0);
	criticalItems = $state(0);
	
	// Attendance Metrics
	totalLaborHours = $state(0);
	salesPerLaborHour = $state(0);

	// Charts
	weeklyData = $state<DayData[]>([]);
	categoryBreakdown = $state<CatData[]>([]);

	constructor() {
		if (typeof window !== 'undefined') {
			const update = () => this.load();
			pb.collection('orders').subscribe('*', update).catch(e => console.error('Orders sub error (reports):', e));
			pb.collection('finances').subscribe('*', update).catch(e => console.error('Finance sub error (reports):', e));
            pb.collection('branch_stocks').subscribe('*', update).catch(e => console.error('Stocks sub error (reports):', e));
		}
	}

	async load() {
		this.loading = true;
		try {
			const branchId = branchesState.selectedBranchId;

			const startOfDay = new Date();
			startOfDay.setHours(0, 0, 0, 0);
			let todayOrderFilter = `created >= '${toFilterDate(startOfDay)}'`;
            let todayItemFilter = `created >= '${toFilterDate(startOfDay)}'`;
			if (branchId) {
                todayOrderFilter += ` && branch="${branchId}"`;
                todayItemFilter += ` && order.branch="${branchId}"`;
            }

			const sevenDaysAgo = new Date();
			sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
			sevenDaysAgo.setHours(0, 0, 0, 0);
			let weekOrderFilter = `created >= '${toFilterDate(sevenDaysAgo)}'`;
            let weekItemFilter = `created >= '${toFilterDate(sevenDaysAgo)}'`;
			if (branchId) {
                weekOrderFilter += ` && branch="${branchId}"`;
                weekItemFilter += ` && order.branch="${branchId}"`;
            }

            // Date filter for finances uses 'date' field
            let financeWeekFilter = `date >= '${sevenDaysAgo.toISOString()}'`;
            if (branchId) financeWeekFilter += ` && branch="${branchId}"`;

            // Attendance filter
            let attendanceFilter = `clock_in >= '${sevenDaysAgo.toISOString().replace('T', ' ').split('.')[0]}'`;
            if (branchId) attendanceFilter += ` && branch="${branchId}"`;

			const [
                todayOrders, 
                todayItems, 
                weekOrders, 
                weekItems, 
                weekFinances,
                stocks,
                attendance
            ] = await Promise.all([
				pb.collection('orders').getFullList({ filter: todayOrderFilter, sort: '-created', expand: 'cashier', requestKey: 'reports-orders-today' }),
				pb.collection('order_items').getFullList({ filter: todayItemFilter, expand: 'product.category', requestKey: 'reports-items-today' }),
				pb.collection('orders').getFullList({ filter: weekOrderFilter, requestKey: 'reports-orders-week' }),
				pb.collection('order_items').getFullList({ filter: weekItemFilter, expand: 'product.category', requestKey: 'reports-items-week' }),
                pb.collection('finances').getFullList({ filter: financeWeekFilter, requestKey: 'reports-finances-week' }),
                pb.collection('branch_stocks').getFullList({ filter: branchId ? `branch="${branchId}"` : '', expand: 'product,supply', requestKey: 'reports-stocks' }),
                pb.collection('attendance').getFullList({ filter: attendanceFilter, requestKey: 'reports-attendance-week' })
			]);

			// 1. Sales & Revenue (Today)
			this.recentOrders = todayOrders;
			this.orderCount = todayOrders.length;
			this.totalRevenue = todayOrders.reduce((acc, o) => acc + (o.total || 0), 0);
			this.avgTicket = this.orderCount > 0 ? this.totalRevenue / this.orderCount : 0;

			// 2. Item Sales Breakdown (Weekly)
            const itemMap = new Map<string, ItemSale>();
            weekItems.forEach(item => {
                if (item.expand?.product) {
                    const existing = itemMap.get(item.product);
                    const revenue = (item.price || 0) * (item.quantity || 0);
                    if (existing) {
                        existing.quantity += item.quantity;
                        existing.revenue += revenue;
                    } else {
                        itemMap.set(item.product, {
                            id: item.product,
                            name: item.expand.product.name,
                            quantity: item.quantity,
                            revenue: revenue,
                            category: item.expand.product.expand?.category?.name || 'Bread'
                        });
                    }
                }
            });
            this.itemSales = Array.from(itemMap.values()).sort((a, b) => b.revenue - a.revenue);
            this.bestSeller = this.itemSales[0] || null;

			// 3. Finance (Week)
			this.totalExpense = weekFinances.filter(f => f.type === 'expense').reduce((acc, f) => acc + (f.amount || 0), 0);
            const weekRevenueFromFinance = weekFinances.filter(f => f.type === 'revenue').reduce((acc, f) => acc + (f.amount || 0), 0);
			this.netProfit = weekRevenueFromFinance - this.totalExpense;

			// 4. Weekly Chart Data (Revenue vs Expense)
			const dayMap = new Map<string, {rev: number, exp: number}>();
			for (let i = 6; i >= 0; i--) {
				const d = new Date();
				d.setDate(d.getDate() - i);
				dayMap.set(d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(), {rev: 0, exp: 0});
			}
            
            // Mix Orders and Finances for charts
			weekOrders.forEach((o) => {
				const key = new Date(o.created).toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
				const cur = dayMap.get(key) || {rev: 0, exp: 0};
                cur.rev += (o.total || 0);
				dayMap.set(key, cur);
			});
            weekFinances.forEach((f) => {
                const key = new Date(f.date).toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
                const cur = dayMap.get(key) || {rev: 0, exp: 0};
                if (f.type === 'expense') cur.exp += (f.amount || 0);
                else if (f.type === 'revenue') {
                    if (!f.reference_id) cur.rev += (f.amount || 0);
                }
                dayMap.set(key, cur);
            });

			this.weeklyData = [...dayMap.entries()].map(([label, val], idx) => {
				const d = new Date();
				d.setDate(d.getDate() - (6 - idx));
				return { 
                    label, 
                    revenue: val.rev, 
                    expense: val.exp, 
                    profit: val.rev - val.exp,
                    fullDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) 
                };
			});

			// 5. Inventory Health
            let invVal = 0;
            let crit = 0;
            stocks.forEach(s => {
                const item = s.expand?.product || s.expand?.supply;
                if (item) {
                    invVal += (item.price || 0) * (s.quantity || 0);
                    if (s.quantity <= (item.min_stock || 0)) crit++;
                }
            });
            this.inventoryValue = invVal;
            this.criticalItems = crit;

            // 6. Labor Hours
            let labor = 0;
            attendance.forEach(a => {
                if (a.clock_in && a.clock_out) {
                    const diff = new Date(a.clock_out).getTime() - new Date(a.clock_in).getTime();
                    labor += diff / (1000 * 60 * 60); // hours
                }
            });
            this.totalLaborHours = labor;
            this.salesPerLaborHour = labor > 0 ? (weekRevenueFromFinance / labor) : 0;

			// 7. Category breakdown
			const catCountMap = new Map<string, number>();
			let totalItems = 0;
			weekItems.forEach((item) => {
				const cat = item.expand?.product?.expand?.category?.name || 'Uncategorized';
				catCountMap.set(cat, (catCountMap.get(cat) || 0) + item.quantity);
				totalItems += item.quantity;
			});
			const catSorted = [...catCountMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
			let offset = 0;
			this.categoryBreakdown = catSorted.map(([name, count]) => {
				const pct = totalItems > 0 ? Math.round((count / totalItems) * 100) : 0;
				const entry = { name, count, pct, offset };
				offset += pct;
				return entry;
			});
		} catch (err: any) {
            if (err?.isAbort) return; // Ignore intentional aborts
			console.error('Reports load error:', err);
		} finally {
			this.loading = false;
		}
	}
}

export const reportsState = new ReportsState();
