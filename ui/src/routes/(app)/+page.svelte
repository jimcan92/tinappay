<script lang="ts">
	import { page } from '$app/state';
	import BakingLoader from '$lib/components/BakingLoader.svelte';
	import ArtisanalCard from '$lib/components/artisanal/ArtisanalCard.svelte';
	import { fileUrl, pb } from '$lib/pocketbase';
	import { branchesState } from '$lib/states/branches.svelte';
	import { ordersState } from '$lib/states/orders.svelte';
	import BarChart from './BarChart.svelte';

	let criticalAlerts = $state<any[]>([]);
	let loading = $state(true);
	let revenueRange = $state<'weekly' | 'monthly'>('weekly');

	let displayBars = $derived(
		revenueRange === 'weekly' ? ordersState.weeklyBars : ordersState.monthlyBars
	);
	let displayRevenue = $derived(
		revenueRange === 'weekly' ? ordersState.weeklyRevenue : ordersState.monthlyRevenue
	);
	let emptyCount = $derived(revenueRange === 'weekly' ? 7 : 5);

	let userName = $derived(
		(page.data?.user?.name as string | undefined) || pb.authStore.record?.name || 'Baker'
	);

	let today = new Date().toLocaleDateString('en-US', {
		month: 'long',
		day: 'numeric',
		year: 'numeric'
	});

	async function loadData() {
		const branchId = branchesState.selectedBranchId;
		loading = true;
		try {
			// Fetch dashboard stats (revenue, top products, etc.) for the branch
			const dashboardPromise = ordersState.loadDashboardData(branchId);

			// Fetch critical stocks. With a branch selected, filter branch_stocks directly.
			// Without a branch, aggregate across all branches per supply and filter client-side.
			const stockPromise = branchId
				? pb
						.collection('branch_stocks')
						.getFullList({
							filter: `branch = '${branchId}' && quantity <= supply.min_stock && supply.id != ""`,
							expand: 'supply.category',
							sort: 'quantity'
						})
						.then((list) =>
							list.map((bs) => ({
								name: bs.expand?.supply?.name,
								current_stock: bs.quantity,
								min_stock: bs.expand?.supply?.min_stock,
								unit: bs.expand?.supply?.unit,
								category_name: bs.expand?.supply?.expand?.category?.name || 'Supply'
							}))
						)
				: (async () => {
						const [supplies, stocks] = await Promise.all([
							pb.collection('supplies').getFullList({ expand: 'category' }),
							pb.collection('branch_stocks').getFullList({ filter: 'supply.id != ""' })
						]);
						const totals = new Map<string, number>();
						for (const s of stocks) {
							if (!s.supply) continue;
							totals.set(s.supply, (totals.get(s.supply) ?? 0) + (s.quantity || 0));
						}
						return supplies
							.map((s) => ({
								name: s.name,
								current_stock: totals.get(s.id) ?? 0,
								min_stock: s.min_stock,
								unit: s.unit,
								category_name: s.expand?.category?.name || 'Supply'
							}))
							.filter((a) => a.current_stock <= (a.min_stock || 0))
							.sort((a, b) => a.current_stock - b.current_stock);
					})();

			const [_, alerts] = await Promise.all([dashboardPromise, stockPromise]);
			criticalAlerts = alerts;
		} catch (e) {
			console.error('Dashboard load error:', e);
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		// Reactive trigger: reload data whenever branchId changes
		loadData();
	});
</script>

<svelte:head>
	<title>Dashboard | tinAPPay ERP</title>
</svelte:head>

<div class="mx-auto max-w-[1600px] animate-in px-6 py-8 duration-700 fade-in md:px-10 md:py-10">
	{#if loading}
		<div class="flex h-[60vh] items-center justify-center">
			<BakingLoader />
		</div>
	{:else}
		<!-- Hero Header -->
		<div class="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
			<div>
				<h2
					class="mb-2 font-serif text-3xl font-extrabold tracking-tight text-on-surface md:text-4xl"
				>
					{new Date().getHours() < 12
						? 'Good morning'
						: new Date().getHours() < 18
							? 'Good afternoon'
							: 'Good evening'}, {userName}.
				</h2>
				<p class="text-lg font-medium text-on-surface-variant">
					The ovens are at temperature. You have <span class="font-bold text-primary"
						>{ordersState.todayOrderCount} orders</span
					> today.
				</p>
			</div>
			<div
				class="flex items-center gap-3 self-start rounded-2xl border border-outline-variant/5 bg-surface-container-low px-6 py-3 shadow-sm"
			>
				<span class="material-symbols-outlined text-primary">calendar_today</span>
				<span class="font-bold text-on-surface">{today}</span>
			</div>
		</div>

		<!-- Bento Grid -->
		<div class="grid grid-cols-12 gap-6">
			<!-- Revenue Insights — Stitch: bg-surface-container-lowest, rounded-[2rem] -->
			<ArtisanalCard level="lowest" class="relative col-span-12 overflow-hidden p-8 lg:col-span-8">
				<div
					class="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl"
				></div>
				<!-- Header -->
				<div class="relative z-10 mb-8 flex items-start justify-between">
					<div>
						<h3 class="text-2xl font-bold tracking-tight text-on-surface">Revenue Insights</h3>
						<p class="mt-0.5 text-sm text-on-surface-variant">
							{revenueRange === 'weekly' ? 'Weekly' : 'Monthly'} performance tracking
						</p>
					</div>
					<div class="flex gap-1 rounded-full bg-surface-container p-1">
						<button
							onclick={() => (revenueRange = 'weekly')}
							class="rounded-full px-4 py-1.5 text-xs font-bold transition-all {revenueRange ===
							'weekly'
								? 'bg-surface-container-lowest text-on-surface shadow-sm'
								: 'text-on-surface-variant hover:text-on-surface'}">Weekly</button
						>
						<button
							onclick={() => (revenueRange = 'monthly')}
							class="rounded-full px-4 py-1.5 text-xs font-bold transition-all {revenueRange ===
							'monthly'
								? 'bg-surface-container-lowest text-on-surface shadow-sm'
								: 'text-on-surface-variant hover:text-on-surface'}">Monthly</button
						>
					</div>
				</div>
				<!-- Total -->
				<div class="relative z-10 mb-8 flex items-end gap-6">
					<div>
						<p class="mb-1 text-sm font-medium text-on-surface-variant">Total Sales</p>
						<p class="font-serif text-5xl font-extrabold tracking-tighter text-on-surface">
							₱{displayRevenue.toFixed(2)}
						</p>
					</div>
					<div class="pb-2">
						<span
							class="flex items-center gap-1 rounded-full bg-primary-container/10 px-3 py-1 text-xs font-bold text-primary"
						>
							<span class="material-symbols-outlined text-sm"
								>{revenueRange === 'weekly' ? 'today' : 'calendar_month'}</span
							>
							{revenueRange === 'weekly' ? 'This Week' : 'This Month'}
						</span>
					</div>
				</div>
				<BarChart bars={displayBars} {emptyCount} />
			</ArtisanalCard>

			<!-- Stat Cards -->
			<div class="col-span-12 grid grid-rows-2 gap-6 lg:col-span-4">
				<!-- Today's Sales -->
				<a
					href="/pos"
					class="group hover:shadow-artisan-lg relative flex flex-col justify-between overflow-hidden rounded-[2rem] bg-secondary-container p-8 transition-all"
				>
					<div
						class="absolute -right-4 -bottom-4 opacity-[0.07] transition-transform duration-700 group-hover:scale-110"
					>
						<span
							class="material-symbols-outlined text-[120px] text-on-secondary-container"
							style="font-variation-settings: 'FILL' 1;">receipt_long</span
						>
					</div>
					<div class="relative z-10">
						<p
							class="mb-1 text-[10px] font-black tracking-[0.2em] text-on-secondary-container/60 uppercase"
						>
							Today's Sales
						</p>
						<p
							class="font-serif text-4xl leading-none font-black tracking-tight text-on-secondary-container"
						>
							₱{ordersState.todayRevenue.toFixed(2)}
						</p>
					</div>
					<div class="relative z-10 flex items-center justify-between">
						<div
							class="flex items-center gap-2 rounded-full bg-on-secondary-container/10 px-3 py-1.5"
						>
							<span
								class="material-symbols-outlined text-sm text-on-secondary-container"
								style="font-variation-settings: 'FILL' 1;">shopping_bag</span
							>
							<span class="text-xs font-black text-on-secondary-container"
								>{ordersState.todayOrderCount} orders</span
							>
						</div>
						<span
							class="material-symbols-outlined text-on-secondary-container/40 transition-transform group-hover:translate-x-1"
							>arrow_forward</span
						>
					</div>
				</a>

				<!-- Top Performer Staff -->
				<a
					href="/management/staff"
					class="group hover:shadow-artisan-lg relative flex flex-col justify-between overflow-hidden rounded-[2rem] bg-tertiary-container p-8 transition-all"
				>
					<div
						class="absolute -right-4 -bottom-4 opacity-[0.07] transition-transform duration-700 group-hover:scale-110"
					>
						<span
							class="material-symbols-outlined text-[120px] text-on-tertiary-container"
							style="font-variation-settings: 'FILL' 1;">military_tech</span
						>
					</div>

					<div class="relative z-10">
						<p
							class="mb-4 text-[10px] font-black tracking-[0.2em] text-on-tertiary-container/60 uppercase"
						>
							Top Performer This Week
						</p>

						{#if ordersState.topCashiers.length > 0}
							{@const top = ordersState.topCashiers[0]}
							<div class="mb-3 flex items-center gap-3">
								<div
									class="h-12 w-12 shrink-0 overflow-hidden rounded-2xl border-2 border-white/30 bg-white/20 shadow-sm"
								>
									{#if top.avatar}
										<img
											src={fileUrl(top.user, top.avatar)}
											alt=""
											class="h-full w-full object-cover"
										/>
									{:else}
										<div
											class="flex h-full w-full items-center justify-center text-sm font-black text-on-tertiary-container/60 uppercase"
										>
											{top.name.substring(0, 2)}
										</div>
									{/if}
								</div>
								<div class="min-w-0">
									<p
										class="truncate font-serif text-lg leading-tight font-black text-on-tertiary-container"
									>
										{top.name}
									</p>
									<p
										class="text-[10px] font-black tracking-widest text-on-tertiary-container/60 uppercase"
									>
										{top.role}
									</p>
								</div>
							</div>
							<div class="flex items-center gap-3">
								<span
									class="rounded-full bg-on-tertiary-container/10 px-3 py-1 text-[10px] font-black text-on-tertiary-container"
								>
									{top.orderCount} orders
								</span>
								<span class="font-serif font-black text-on-tertiary-container"
									>₱{top.revenue.toFixed(2)}</span
								>
							</div>
						{:else}
							<div class="flex items-center gap-3">
								<div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
									<span
										class="material-symbols-outlined text-on-tertiary-container/30"
										style="font-variation-settings: 'FILL' 1;">military_tech</span
									>
								</div>
								<div>
									<p class="text-sm font-bold text-on-tertiary-container/50">
										No sales this week yet
									</p>
									<p class="mt-0.5 text-[10px] font-medium text-on-tertiary-container/30">
										Rankings will appear once orders are placed
									</p>
								</div>
							</div>
						{/if}
					</div>

					<div class="relative z-10 mt-2 flex items-center justify-between">
						<p class="text-xs font-bold text-on-tertiary-container/60">View Staff</p>
						<span
							class="material-symbols-outlined text-on-tertiary-container/40 transition-transform group-hover:translate-x-1"
							>arrow_forward</span
						>
					</div>
				</a>
			</div>

			<!-- Critical Stock — Stitch: alternating rows, no dividers -->
			<ArtisanalCard level="lowest" class="col-span-12 p-8 lg:col-span-7">
				<div class="mb-8 flex items-center justify-between">
					<div>
						<h3 class="text-2xl font-bold tracking-tight text-on-surface">Critical Stock</h3>
						<p class="mt-0.5 text-sm text-on-surface-variant">
							Ingredients requiring immediate replenishment
						</p>
					</div>
					<a
						href="/restock"
						class="text-sm font-bold text-primary underline decoration-primary/30 underline-offset-4 transition-all hover:decoration-primary"
					>
						Manage Inventory
					</a>
				</div>
				<!-- Table header -->
				<div
					class="mb-1 grid grid-cols-12 px-4 py-2 text-[10px] font-bold tracking-widest text-on-surface-variant uppercase"
				>
					<div class="col-span-5">Ingredient</div>
					<div class="col-span-3 text-right">Current Level</div>
					<div class="col-span-4 text-right">Action</div>
				</div>
				<!-- Rows — alternating bg, no dividers -->
				<div class="space-y-1">
					{#each criticalAlerts.slice(0, 5) as ing, i}
						<div
							class="grid grid-cols-12 items-center rounded-2xl px-4 py-4 transition-colors {i %
								2 ===
							0
								? 'bg-surface-container-low'
								: 'bg-surface-container-lowest'} hover:bg-surface-container-high/50"
						>
							<div class="col-span-5 flex items-center gap-3">
								<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-surface">
									<span class="material-symbols-outlined text-on-surface-variant">grain</span>
								</div>
								<div>
									<p class="font-bold text-on-surface">{ing.name}</p>
									<p class="text-xs text-on-surface-variant">
										{ing.category_name}
									</p>
								</div>
							</div>
							<div class="col-span-3 text-right">
								<p class="font-serif font-bold text-error">{ing.current_stock} {ing.unit}</p>
								<p class="text-[10px] text-on-surface-variant">Min: {ing.min_stock}</p>
							</div>
							<div class="col-span-4 text-right">
								<a
									href="/restock"
									class="inline-block rounded-full bg-error-container px-4 py-1.5 text-[11px] font-bold text-on-error-container transition-all hover:scale-105 active:scale-95"
								>
									REORDER NOW
								</a>
							</div>
						</div>
					{:else}
						<div class="py-16 text-center text-sm font-medium text-on-surface-variant/40">
							All ingredients are at optimal levels.
						</div>
					{/each}
				</div>
			</ArtisanalCard>

			<!-- Top Performers — Stitch style -->
			<div
				class="col-span-12 rounded-[2rem] border border-outline-variant/10 bg-surface-container-highest/30 p-8 lg:col-span-5"
			>
				<h3 class="mb-6 text-xl font-bold text-on-surface">
					Top Performers
					<span
						class="mt-1 block text-xs font-normal tracking-wider text-on-surface-variant uppercase"
						>By Daily Volume</span
					>
				</h3>
				<div class="space-y-6">
					{#each ordersState.topProducts as item}
						{@const maxCount = Math.max(...ordersState.topProducts.map((p) => p.count), 1)}
						<div class="flex items-center gap-4">
							<div
								class="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-surface-container object-cover"
							>
								{#if item.image}
									<img
										class="h-full w-full object-cover"
										src={fileUrl(item.product, item.image)}
										alt={item.name}
									/>
								{:else}
									<div
										class="flex h-full w-full items-center justify-center text-lg font-bold text-on-surface-variant/40 uppercase"
									>
										{item.name.substring(0, 2)}
									</div>
								{/if}
							</div>
							<div class="min-w-0 flex-1">
								<p class="truncate font-bold text-on-surface">{item.name}</p>
								<div class="mt-2 h-1.5 w-full rounded-full bg-surface-container-high">
									<div
										class="h-full rounded-full bg-primary transition-all duration-1000"
										style="width: {Math.round((item.count / maxCount) * 100)}%"
									></div>
								</div>
							</div>
							<div class="shrink-0 pl-2 text-right">
								<p class="font-serif text-2xl font-bold text-on-surface">{item.count}</p>
								<p class="text-[10px] text-on-surface-variant">Units</p>
							</div>
						</div>
					{:else}
						<div class="py-16 text-center text-sm font-medium text-on-surface-variant/40">
							No sales recorded today yet.
						</div>
					{/each}
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	:global(.animate-in) {
		animation-fill-mode: forwards;
	}
</style>
