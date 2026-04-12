<script lang="ts">
	import { onMount } from 'svelte';
	import { pb } from '$lib/pocketbase';
	import ArtisanalCard from '$lib/components/artisanal/ArtisanalCard.svelte';
    import BakingLoader from '$lib/components/BakingLoader.svelte';

	let totalRevenue = $state(0);
	let orderCount = $state(0);
	let avgTicket = $state(0);
	let bestSeller = $state<any>(null);
	let recentOrders = $state<any[]>([]);
	let loading = $state(true);

	onMount(async () => {
		try {
			const startOfDay = new Date();
			startOfDay.setHours(0, 0, 0, 0);
			const filter = `created >= "${startOfDay.toISOString().replace('T', ' ')}"`;

			const [orders, orderItems] = await Promise.all([
				pb.collection('orders').getFullList({ 
					filter,
					sort: '-created',
					expand: 'cashier'
				}),
				pb.collection('order_items').getFullList({
					filter,
					expand: 'product'
				})
			]);

			recentOrders = orders;
			orderCount = orders.length;
			totalRevenue = orders.reduce((acc, o) => acc + o.total, 0);
			avgTicket = orderCount > 0 ? totalRevenue / orderCount : 0;

			const salesMap = new Map();
			orderItems.forEach((item) => {
				const prodId = item.product;
				if (item.expand?.product) {
					const current = salesMap.get(prodId) || { name: item.expand.product.name, count: 0, image: item.expand.product.image, product: item.expand.product };
					current.count += item.quantity;
					salesMap.set(prodId, current);
				}
			});

			const sorted = Array.from(salesMap.values()).sort((a, b) => b.count - a.count);
			if (sorted.length > 0) {
				bestSeller = sorted[0];
			}
		} catch (error) {
			console.error('Failed to fetch reports:', error);
		} finally {
			loading = false;
		}
	});
</script>

<div class="px-6 py-10 md:px-12 max-w-[1600px] mx-auto overflow-hidden">
	<!-- Top Bar / Actions (Desktop) -->
	<header class="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
		<div>
			<h1 class="text-4xl md:text-5xl font-black text-on-surface tracking-tight mb-3 font-serif">Analytics & Reports</h1>
			<p class="text-on-surface-variant text-lg max-w-2xl font-medium leading-relaxed">Real-time performance metrics and deep financial auditing for your bakery.</p>
		</div>
		<div class="flex items-center gap-3">
			<button class="flex items-center gap-2 px-6 py-3 rounded-full border border-outline-variant/20 bg-surface-container-lowest text-sm font-bold hover:bg-surface-container-low transition-all">
				<span class="material-symbols-outlined text-primary">calendar_today</span>
				Oct 24, 2024
			</button>
			<button class="flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all uppercase tracking-widest">
				<span class="material-symbols-outlined">file_download</span>
				Export
			</button>
		</div>
	</header>

	{#if loading}
		<div class="flex h-64 items-center justify-center">
			<BakingLoader />
		</div>
	{:else}
		<!-- TOP ROW: HERO METRICS -->
		<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
			<!-- Revenue -->
			<ArtisanalCard level="lowest" class="relative overflow-hidden border border-outline-variant/10 shadow-sm group hover:shadow-md">
				<div class="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-primary/5 group-hover:scale-110 transition-transform"></div>
				<div class="flex items-center justify-between mb-6">
					<div class="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
						<span class="material-symbols-outlined">payments</span>
					</div>
					<span class="text-[10px] font-black text-tertiary bg-tertiary-container/20 px-2 py-1 rounded-lg tracking-widest">+12.4%</span>
				</div>
				<p class="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] mb-1">Total Revenue</p>
				<h3 class="text-4xl font-serif font-black text-on-surface tracking-tighter">${totalRevenue.toFixed(2)}</h3>
			</ArtisanalCard>

			<!-- Orders -->
			<ArtisanalCard level="lowest" class="relative overflow-hidden border border-outline-variant/10 shadow-sm group hover:shadow-md">
				<div class="flex items-center justify-between mb-6">
					<div class="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
						<span class="material-symbols-outlined">receipt_long</span>
					</div>
					<span class="text-[10px] font-black text-error bg-error-container/10 px-2 py-1 rounded-lg tracking-widest">-4.2%</span>
				</div>
				<p class="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] mb-1">Total Orders</p>
				<h3 class="text-4xl font-serif font-black text-on-surface tracking-tighter">{orderCount}</h3>
			</ArtisanalCard>

			<!-- Average Ticket -->
			<ArtisanalCard level="lowest" class="relative overflow-hidden border border-outline-variant/10 shadow-sm group hover:shadow-md">
				<div class="flex items-center justify-between mb-6">
					<div class="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
						<span class="material-symbols-outlined">trending_up</span>
					</div>
					<span class="text-[10px] font-black text-tertiary bg-tertiary-container/20 px-2 py-1 rounded-lg tracking-widest">+18%</span>
				</div>
				<p class="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] mb-1">Avg Ticket</p>
				<h3 class="text-4xl font-serif font-black text-on-surface tracking-tighter">${avgTicket.toFixed(2)}</h3>
			</ArtisanalCard>

			<!-- Top Performer -->
			{#if bestSeller}
				<div class="relative overflow-hidden rounded-[2rem] border border-primary/20 bg-gradient-to-br from-primary to-primary-container text-white p-8 shadow-xl shadow-primary/20 group hover:scale-[1.02] transition-all">
					<div class="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
					<p class="relative z-10 text-[10px] font-black text-on-primary/70 uppercase tracking-[0.3em] mb-6">Top Performer</p>
					<h3 class="relative z-10 text-2xl font-serif font-black mb-1 leading-tight">{bestSeller.name}</h3>
					<p class="relative z-10 text-sm font-bold text-on-primary/80 uppercase tracking-widest">{bestSeller.count} Sold Today</p>
					<div class="absolute bottom-4 right-4 opacity-20 transform group-hover:rotate-12 transition-transform duration-700">
						<span class="material-symbols-outlined text-7xl">star</span>
					</div>
				</div>
			{/if}
		</div>

		<!-- MIDDLE ROW: TRENDS & ANALYTICS -->
		<div class="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-12">
			<!-- Sales Trend Chart -->
			<ArtisanalCard level="lowest" class="xl:col-span-2 border border-outline-variant/10 shadow-sm">
				<div class="flex items-center justify-between mb-12">
					<div>
						<h3 class="text-2xl font-black text-on-surface font-serif tracking-tight">Sales Velocity</h3>
						<p class="text-xs text-on-surface-variant font-bold uppercase tracking-widest mt-1">Revenue trend over the last cycle</p>
					</div>
					<div class="flex p-1 bg-surface-container rounded-xl">
						<button class="px-4 py-2 rounded-lg bg-white shadow-sm text-[10px] font-black text-primary uppercase tracking-widest">Revenue</button>
						<button class="px-4 py-2 rounded-lg text-[10px] font-black text-on-surface-variant uppercase tracking-widest hover:text-on-surface transition-all">Volume</button>
					</div>
				</div>
				
				<div class="relative flex h-64 w-full items-end justify-between px-4 pb-2">
					<!-- Grid Lines -->
					<div class="absolute inset-0 flex flex-col justify-between opacity-[0.03] pointer-events-none px-4">
						{#each Array(5) as _}
							<div class="w-full h-px bg-on-surface"></div>
						{/each}
					</div>
					
					{#each ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as day, i}
						<div class="group relative flex flex-col items-center gap-6 w-full">
							<div class="absolute -top-14 opacity-0 group-hover:opacity-100 transition-all bg-on-surface text-surface text-[10px] font-black px-3 py-1.5 rounded-full shadow-2xl whitespace-nowrap z-10">
								$ {(Math.random() * 500 + 300).toFixed(2)}
							</div>
							<div 
								class="w-10 md:w-14 lg:w-20 rounded-t-[1.5rem] transition-all duration-700 cursor-pointer shadow-inner
								{i === 3 ? 'bg-primary shadow-[0_0_20px_rgba(155,64,0,0.3)] h-full' : 'bg-surface-container-high group-hover:bg-primary-container/40'}" 
								style="height: {Math.random() * 150 + 50}px"
							></div>
							<span class="text-[10px] font-black {i === 3 ? 'text-primary' : 'text-on-surface-variant'} uppercase tracking-[0.2em]">{day}</span>
						</div>
					{/each}
				</div>
			</ArtisanalCard>

			<!-- Distribution -->
			<ArtisanalCard level="lowest" class="border border-outline-variant/10 shadow-sm flex flex-col">
				<h3 class="text-2xl font-black text-on-surface font-serif tracking-tight mb-10">Category Mix</h3>
				<div class="flex-1 flex flex-col justify-center">
					<div class="relative h-56 w-56 mx-auto mb-12">
						<svg viewBox="0 0 36 36" class="w-full h-full transform -rotate-90">
							<circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" stroke-width="4" class="text-surface-container-low"></circle>
							<circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" stroke-width="4" class="text-primary shadow-xl" stroke-dasharray="65 100"></circle>
							<circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" stroke-width="4" class="text-primary-container/40" stroke-dasharray="25 100" stroke-dashoffset="-65"></circle>
						</svg>
						<div class="absolute inset-0 flex flex-col items-center justify-center">
							<span class="text-4xl font-serif font-black text-on-surface tracking-tighter">65%</span>
							<span class="text-[9px] font-black text-on-surface-variant uppercase tracking-[0.2em] mt-1">Sourdough</span>
						</div>
					</div>
					<div class="space-y-4 px-4">
						<div class="flex items-center justify-between group cursor-pointer">
							<div class="flex items-center gap-3">
								<div class="h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_8px_rgba(155,64,0,0.4)]"></div>
								<span class="text-xs font-bold text-on-surface group-hover:text-primary transition-colors uppercase tracking-widest">Artisan Breads</span>
							</div>
							<span class="text-xs font-black text-on-surface">65.2%</span>
						</div>
						<div class="flex items-center justify-between group cursor-pointer">
							<div class="flex items-center gap-3">
								<div class="h-2.5 w-2.5 rounded-full bg-primary-container/40"></div>
								<span class="text-xs font-bold text-on-surface group-hover:text-primary transition-colors uppercase tracking-widest">Pastries</span>
							</div>
							<span class="text-xs font-black text-on-surface">24.8%</span>
						</div>
						<div class="flex items-center justify-between group cursor-pointer">
							<div class="flex items-center gap-3">
								<div class="h-2.5 w-2.5 rounded-full bg-surface-container-highest"></div>
								<span class="text-xs font-bold text-on-surface group-hover:text-primary transition-colors uppercase tracking-widest">Beverages</span>
							</div>
							<span class="text-xs font-black text-on-surface">10.0%</span>
						</div>
					</div>
				</div>
			</ArtisanalCard>
		</div>

		<!-- BOTTOM ROW: DATA TABLES -->
		<section class="mb-12">
			<div class="flex items-center justify-between mb-8 px-2">
				<div>
					<h3 class="text-3xl font-black text-on-surface font-serif tracking-tight">Recent Transactions</h3>
					<p class="text-xs text-on-surface-variant font-bold uppercase tracking-widest mt-1">Full audit log of bakery sales terminal</p>
				</div>
				<button class="text-[10px] font-black text-primary uppercase tracking-[0.3em] border-b-2 border-primary/10 hover:border-primary transition-all pb-1 active:scale-95">Full Ledger Access</button>
			</div>

			<ArtisanalCard level="lowest" class="p-0 overflow-hidden border border-outline-variant/10 shadow-sm">
				<div class="overflow-x-auto no-scrollbar">
					<table class="w-full text-left border-collapse">
						<thead>
							<tr class="bg-surface-container-low text-on-surface-variant text-[10px] font-black uppercase tracking-[0.2em]">
								<th class="px-8 py-5">Transaction ID</th>
								<th class="px-8 py-5">Timestamp</th>
								<th class="px-8 py-5">Operator</th>
								<th class="px-8 py-5 text-right">Amount</th>
								<th class="px-8 py-5 text-center">Status</th>
								<th class="px-8 py-5 text-right">Action</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-outline-variant/5">
							{#each recentOrders as order}
								<tr class="hover:bg-surface-container-low/40 transition-colors group cursor-pointer">
									<td class="px-8 py-6">
										<span class="text-sm font-black text-on-surface uppercase tracking-tight">#TXN-{order.id.substring(0, 8)}</span>
									</td>
									<td class="px-8 py-6">
										<div class="flex flex-col">
											<span class="text-sm font-bold text-on-surface">{new Date(order.created).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
											<span class="text-[9px] font-black text-on-surface-variant uppercase tracking-widest opacity-60">{new Date(order.created).toLocaleDateString()}</span>
										</div>
									</td>
									<td class="px-8 py-6">
										<div class="flex items-center gap-3">
											<div class="h-9 w-9 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center text-primary text-[10px] font-black uppercase shadow-inner">
												{order.expand?.cashier?.name?.substring(0, 2) || 'US'}
											</div>
											<span class="text-sm font-bold text-on-surface">{order.expand?.cashier?.name || 'Authorized Staff'}</span>
										</div>
									</td>
									<td class="px-8 py-6 text-right">
										<span class="font-serif font-black text-primary text-base">${order.total.toFixed(2)}</span>
									</td>
									<td class="px-8 py-6 text-center">
										<span class="inline-flex items-center px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] bg-tertiary-container/30 text-tertiary border border-tertiary/10">
											{order.status}
										</span>
									</td>
									<td class="px-8 py-6 text-right">
										<button class="h-10 w-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-primary hover:text-white transition-all active:scale-90 shadow-sm mx-auto">
											<span class="material-symbols-outlined text-lg">arrow_forward</span>
										</button>
									</td>
								</tr>
							{/each}
							{#if recentOrders.length === 0}
								<tr>
									<td colspan="6" class="px-8 py-24 text-center text-on-surface-variant opacity-40 font-black uppercase tracking-[0.3em] text-xs">The ledger is currently clear.</td>
								</tr>
							{/if}
						</tbody>
					</table>
				</div>
			</ArtisanalCard>
		</section>
	{/if}
</div>

<style>
	.no-scrollbar::-webkit-scrollbar {
		display: none;
	}
	.no-scrollbar {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
	
	table {
		border-spacing: 0;
	}
</style>
