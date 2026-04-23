import { pb } from '$lib/pocketbase';
import type { OrderItemsResponse, OrdersResponse, ProductsResponse } from '$lib/pocketbase-types';

export interface BarData {
	label: string;
	pct: number;
	highlight: boolean;
	revenue: number;
}

export interface TopProduct {
	name: string;
	count: number;
	image: string;
	product: any;
	price: number;
}

export interface TopCashier {
	id: string;
	name: string;
	avatar: string;
	role: string;
	orderCount: number;
	revenue: number;
	user: any;
}

function toFilterDate(d: Date): string {
	return d.toISOString().replace('T', ' ').split('.')[0];
}

/** Returns this week's Mon–Sun as {start, end, label, isToday}[7] */
function currentWeekDays(today: Date) {
	const dow = today.getDay(); // 0=Sun … 6=Sat
	const daysSinceMon = dow === 0 ? 6 : dow - 1;
	const monday = new Date(today);
	monday.setDate(monday.getDate() - daysSinceMon);
	monday.setHours(0, 0, 0, 0);

	return Array.from({ length: 7 }, (_, i) => {
		const start = new Date(monday);
		start.setDate(monday.getDate() + i);
		const end = new Date(start);
		end.setHours(23, 59, 59, 999);
		return {
			start,
			end,
			label: start.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
			isToday: start.toDateString() === today.toDateString()
		};
	});
}

/** Returns Mon–Sun week segments covering the full current month */
function currentMonthWeeks(today: Date) {
	const year = today.getFullYear();
	const month = today.getMonth();
	const monthEnd = new Date(year, month + 1, 0); // last day of month
	const shortMonth = today.toLocaleDateString('en-US', { month: 'short' });

	const weeks: { start: Date; end: Date; label: string; isCurrent: boolean }[] = [];
	let cursor = new Date(year, month, 1, 0, 0, 0, 0); // 1st of month

	while (cursor <= monthEnd) {
		const dow = cursor.getDay(); // 0=Sun … 6=Sat
		// Days until the coming Sunday (0 if already Sunday)
		const daysUntilSun = dow === 0 ? 0 : 7 - dow;

		let end = new Date(cursor);
		end.setDate(cursor.getDate() + daysUntilSun);
		if (end > monthEnd) end = new Date(monthEnd);
		end.setHours(23, 59, 59, 999);

		const startDay = cursor.getDate();
		const endDay = end.getDate();
		// "Current" week = contains today
		const isCurrent = today >= cursor && today <= end;

		weeks.push({
			start: new Date(cursor),
			end,
			label: `${shortMonth} ${startDay}–${endDay}`,
			isCurrent
		});

		// Advance to next Monday
		cursor = new Date(end);
		cursor.setDate(cursor.getDate() + 1);
		cursor.setHours(0, 0, 0, 0);
	}

	return weeks;
}

function computeBars(
	segments: { start: Date; end: Date; label: string; highlight: boolean }[],
	orders: { created: string; total: number }[]
): BarData[] {
	const revenues = segments.map((seg) => {
		const revenue = orders
			.filter((o) => {
				const t = new Date(o.created);
				return t >= seg.start && t <= seg.end;
			})
			.reduce((s, o) => s + (o.total || 0), 0);
		return { label: seg.label, revenue, highlight: seg.highlight };
	});

	const max = Math.max(...revenues.map((r) => r.revenue), 1);
	return revenues.map((r) => ({
		...r,
		pct: Math.max(4, (r.revenue / max) * 100)
	}));
}

class OrdersState {
	// Raw data
	todayOrders = $state<OrdersResponse[]>([]);
	todayItems = $state<OrderItemsResponse<{ product: ProductsResponse }>[]>([]);

	// Chart bars
	weeklyBars = $state<BarData[]>([]);
	monthlyBars = $state<BarData[]>([]);

	// Totals
	todayRevenue = $state(0);
	weeklyRevenue = $state(0);
	monthlyRevenue = $state(0);
	todayOrderCount = $state(0);

	// Top products (today)
	topProducts = $state<TopProduct[]>([]);

	// Top cashiers (today)
	topCashiers = $state<TopCashier[]>([]);

	loading = $state(false);

	constructor() {
		if (typeof window !== 'undefined') {
			const update = () => this.loadDashboardData();
			pb.collection('orders').subscribe('*', update).catch(err => console.error('Orders subscription error:', err));
			pb.collection('order_items').subscribe('*', update).catch(err => console.error('Order items subscription error:', err));
		}
	}

	async loadDashboardData(branchId?: string) {
		this.loading = true;
		try {
			const now = new Date();
			const today = new Date(now);
			today.setHours(0, 0, 0, 0);

			// Week: Mon of current week
			const weekDays = currentWeekDays(now);
			const weekStart = weekDays[0].start;

			// Month: 1st of current month
			const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

			const branchFilter = branchId ? ` && branch = '${branchId}'` : '';

			const [todayOrders, todayItems, weekOrders, monthOrders] = await Promise.all([
				pb.collection('orders').getFullList<OrdersResponse>({
					filter: `created >= '${toFilterDate(today)}'${branchFilter}`,
					sort: '-created',
					expand: 'cashier',
					requestKey: 'orders-today'
				}),
				pb.collection('order_items').getFullList<OrderItemsResponse<{ product: ProductsResponse }>>({
					filter: `created >= '${toFilterDate(today)}'${branchId ? ` && order.branch = '${branchId}'` : ''}`,
					expand: 'product',
					requestKey: 'items-today'
				}),
				pb.collection('orders').getFullList<OrdersResponse>({
					filter: `created >= '${toFilterDate(weekStart)}'${branchFilter}`,
					expand: 'cashier',
					requestKey: 'orders-week'
				}),
				pb.collection('orders').getFullList<OrdersResponse>({
					filter: `created >= '${toFilterDate(monthStart)}'${branchFilter}`,
					requestKey: 'orders-month'
				})
			]);

			this.todayOrders = todayOrders;
			this.todayItems = todayItems as any;
			this.todayOrderCount = todayOrders.length;
			this.todayRevenue = todayOrders.reduce((s, o) => s + (o.total || 0), 0);

			// Weekly bars — Mon–Sun, this week
			this.weeklyBars = computeBars(
				weekDays.map((d) => ({ ...d, highlight: d.isToday })),
				weekOrders
			);
			this.weeklyRevenue = weekOrders.reduce((s, o) => s + (o.total || 0), 0);

			// Monthly bars — Mon–Sun week segments of current month
			const monthWeeks = currentMonthWeeks(now);
			this.monthlyBars = computeBars(
				monthWeeks.map((w) => ({ ...w, highlight: w.isCurrent })),
				monthOrders
			);
			this.monthlyRevenue = monthOrders.reduce((s, o) => s + (o.total || 0), 0);

			// Top products today
			const salesMap = new Map<string, TopProduct>();
			for (const item of todayItems) {
				if (!item.expand?.product) continue;
				const prod = item.expand.product;
				const entry = salesMap.get(item.product) ?? {
					name: prod.name,
					count: 0,
					image: (prod as any).image ?? ((prod as any).images?.[0] ?? ''),
					product: prod,
					price: prod.price
				};
				entry.count += item.quantity;
				salesMap.set(item.product, entry);
			}
			this.topProducts = [...salesMap.values()].sort((a, b) => b.count - a.count).slice(0, 5);

			// Top cashiers this week
			const cashierMap = new Map<string, TopCashier>();
			for (const order of weekOrders) {
				const cashier = (order as any).expand?.cashier;
				if (!cashier) continue;
				const entry = cashierMap.get(order.cashier) ?? {
					id: cashier.id,
					name: cashier.name ?? 'Unknown',
					avatar: cashier.avatar ?? '',
					role: cashier.role ?? 'staff',
					orderCount: 0,
					revenue: 0,
					user: cashier
				};
				entry.orderCount += 1;
				entry.revenue += order.total || 0;
				cashierMap.set(order.cashier, entry);
			}
			this.topCashiers = [...cashierMap.values()].sort((a, b) => b.revenue - a.revenue);
		} finally {
			this.loading = false;
		}
	}
}

export const ordersState = new OrdersState();
