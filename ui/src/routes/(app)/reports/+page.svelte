<script lang="ts">
	import ArtisanalCard from '$lib/components/artisanal/ArtisanalCard.svelte';
	import BakingLoader from '$lib/components/BakingLoader.svelte';
	import PaginatedTable from '$lib/components/PaginatedTable.svelte';
	import { branchesState } from '$lib/states/branches.svelte';
	import { reportsState } from '$lib/states/reports.svelte';
	import { onMount } from 'svelte';

	const PIE_COLORS = ['text-primary', 'text-primary-container', 'text-secondary-container'];
	const PIE_DOT_COLORS = [
		'bg-primary shadow-[0_0_8px_rgba(155,64,0,0.4)]',
		'bg-primary-container/60',
		'bg-surface-container-highest'
	];

	let maxVal = $derived(
		Math.max(...reportsState.weeklyData.map((d) => Math.max(d.revenue, d.expense)), 1)
	);
	let maxItemRevenue = $derived(Math.max(...reportsState.itemSales.map((i) => i.revenue), 1));
	let selectedBranchName = $derived(branchesState.selectedBranchId || 'All Operations');

	onMount(() => reportsState.load());

	$effect(() => {
		if (branchesState.selectedBranchId) {
			reportsState.load();
		}
	});
</script>

<svelte:head>
	<title>Analytics & Yields | tinAPPay ERP</title>
</svelte:head>

<div class="mx-auto max-w-[1600px] animate-in px-6 py-10 duration-700 fade-in md:px-12">
	<header class="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
		<div>
			<h1 class="font-serif text-4xl font-black tracking-tight text-on-surface md:text-5xl">
				Analytics & Reports
			</h1>
			<p class="mt-3 max-w-2xl text-lg leading-relaxed font-medium text-on-surface-variant">
				Comprehensive audit for <span class="font-bold text-primary">{selectedBranchName}</span>.
				Monitoring throughput, sales velocity, and fiscal yields.
			</p>
		</div>
	</header>

	{#if reportsState.loading}
		<div class="flex h-64 items-center justify-center">
			<BakingLoader />
		</div>
	{:else}
		<!-- TOP SECTION: PRIMARY VISUAL TRENDS -->
		<div class="mb-12 grid grid-cols-1 gap-8 xl:grid-cols-3">
			<!-- Revenue vs Expense Chart -->
			<ArtisanalCard
				level="lowest"
				class="border border-outline-variant/10 p-10 shadow-sm xl:col-span-2"
			>
				<div class="mb-12 flex items-center justify-between">
					<div>
						<h3 class="font-serif text-2xl font-black tracking-tight text-on-surface uppercase">
							Financial Velocity
						</h3>
						<p
							class="mt-1 text-[10px] font-black tracking-widest text-on-surface-variant uppercase"
						>
							Weekly Income vs Operational Expenses
						</p>
					</div>
					<div class="flex items-center gap-6">
						<div class="flex items-center gap-2">
							<span class="h-3 w-3 rounded-full bg-primary shadow-lg shadow-primary/20"></span>
							<span class="text-[9px] font-black tracking-widest text-on-surface-variant uppercase"
								>Revenue</span
							>
						</div>
						<div class="flex items-center gap-2">
							<span class="h-3 w-3 rounded-full bg-surface-container-highest"></span>
							<span class="text-[9px] font-black tracking-widest text-on-surface-variant uppercase"
								>Expense</span
							>
						</div>
					</div>
				</div>

				<div class="relative flex h-80 w-full items-end justify-between px-4 pb-4">
					<div
						class="pointer-events-none absolute inset-0 flex flex-col justify-between px-4 opacity-[0.05]"
					>
						{#each Array(6) as _}
							<div class="h-px w-full bg-on-surface"></div>
						{/each}
					</div>

					{#each reportsState.weeklyData as day}
						<div class="group relative flex w-full flex-col items-center gap-6">
							<!-- Tooltip -->
							<div
								class="absolute -top-20 z-10 flex flex-col gap-1 rounded-2xl bg-on-surface p-4 text-[10px] font-black whitespace-nowrap text-surface opacity-0 shadow-2xl transition-all group-hover:opacity-100"
							>
								<span class="text-surface/50">{day.fullDate}</span>
								<span class="text-primary">REV: ₱{day.revenue.toLocaleString()}</span>
								<span class="text-surface/70">EXP: ₱{day.expense.toLocaleString()}</span>
								<span class="mt-1 border-t border-surface/20 pt-1 text-white"
									>NET: ₱{day.profit.toLocaleString()}</span
								>
							</div>

							<div class="flex items-end gap-1">
								<div
									class="w-4 rounded-t-xl bg-primary shadow-lg shadow-primary/10 transition-all duration-700 group-hover:scale-x-110 sm:w-6 lg:w-8"
									style="height: {(day.revenue / maxVal) * 260 || 4}px"
								></div>
								<div
									class="w-4 rounded-t-xl bg-surface-container-highest transition-all duration-700 group-hover:scale-x-110 sm:w-6 lg:w-8"
									style="height: {(day.expense / maxVal) * 260 || 4}px"
								></div>
							</div>
							<span class="text-[10px] font-black tracking-[0.2em] text-on-surface-variant/40"
								>{day.label}</span
							>
						</div>
					{/each}
				</div>
			</ArtisanalCard>

			<!-- Category Mix -->
			<ArtisanalCard
				level="lowest"
				class="flex flex-col border border-outline-variant/10 p-10 shadow-sm"
			>
				<h3 class="mb-12 font-serif text-2xl font-black tracking-tight text-on-surface uppercase">
					Sales Portfolio
				</h3>
				<div class="flex flex-1 flex-col justify-center">
					{#if reportsState.categoryBreakdown.length === 0}
						<div class="flex flex-col items-center justify-center py-20 text-center opacity-40">
							<span class="material-symbols-outlined mb-4 text-5xl text-primary">donut_large</span>
							<p class="text-[10px] font-black tracking-widest text-on-surface-variant uppercase">
								No data to display
							</p>
						</div>
					{:else}
						<div class="relative mx-auto mb-16 h-56 w-56">
							<svg viewBox="0 0 36 36" class="h-full w-full -rotate-90 transform drop-shadow-2xl">
								<circle
									cx="18"
									cy="18"
									r="16"
									fill="none"
									stroke="currentColor"
									stroke-width="4"
									class="text-surface-container-low"
								></circle>
								{#each reportsState.categoryBreakdown as cat, i}
									<circle
										cx="18"
										cy="18"
										r="16"
										fill="none"
										stroke="currentColor"
										stroke-width="4"
										class={PIE_COLORS[i] || 'text-outline-variant'}
										stroke-dasharray="{cat.pct} 100"
										stroke-dashoffset={-cat.offset}
										stroke-linecap="round"
									></circle>
								{/each}
							</svg>
							<div class="absolute inset-0 flex flex-col items-center justify-center">
								<span class="font-serif text-4xl font-black tracking-tighter text-on-surface"
									>{reportsState.categoryBreakdown[0]?.pct ?? 0}%</span
								>
								<span
									class="mt-2 text-[8px] font-black tracking-[0.2em] text-on-surface-variant uppercase"
									>{reportsState.categoryBreakdown[0]?.name ?? ''}</span
								>
							</div>
						</div>
						<div class="space-y-4 px-4">
							{#each reportsState.categoryBreakdown as cat, i}
								<div class="group flex cursor-default items-center justify-between">
									<div class="flex items-center gap-3">
										<div
											class="h-2 w-2 rounded-full {PIE_DOT_COLORS[i] || 'bg-outline-variant'}"
										></div>
										<span
											class="text-[10px] font-black tracking-widest text-on-surface uppercase transition-colors group-hover:text-primary"
											>{cat.name}</span
										>
									</div>
									<div class="flex items-center gap-4">
										<span class="text-[10px] font-black text-on-surface">{cat.pct}%</span>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</ArtisanalCard>
		</div>

		<!-- HERO METRICS BENTO -->
		<div class="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
			<!-- Net Yield -->
			<div
				class="group relative overflow-hidden rounded-[2.5rem] border border-primary/20 bg-gradient-to-br from-primary to-primary-container p-8 text-white shadow-2xl shadow-primary/20 transition-all hover:scale-[1.02]"
			>
				<div class="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
				<div class="relative z-10">
					<div class="mb-8 flex items-center justify-between">
						<div
							class="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 shadow-inner backdrop-blur-md"
						>
							<span class="material-symbols-outlined text-3xl text-white"
								>account_balance_wallet</span
							>
						</div>
						<span
							class="rounded-full bg-white/10 px-3 py-1 text-[10px] font-black tracking-widest text-white/70 uppercase"
							>Weekly Profit</span
						>
					</div>
					<p class="mb-1 text-[10px] font-black tracking-[0.2em] text-white/70 uppercase">
						Fiscal Balance
					</p>
					<h3 class="font-serif text-4xl font-black tracking-tighter text-white">
						₱{reportsState.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
					</h3>
				</div>
				<div
					class="absolute right-4 bottom-4 transform opacity-20 transition-transform duration-700 group-hover:rotate-12"
				>
					<span class="material-symbols-outlined text-7xl">show_chart</span>
				</div>
			</div>

			<!-- Gross Revenue -->
			<ArtisanalCard
				level="lowest"
				class="group relative overflow-hidden border border-outline-variant/10 shadow-sm"
			>
				<div class="mb-6 flex items-center justify-between">
					<div
						class="flex h-12 w-12 items-center justify-center rounded-2xl bg-tertiary/10 text-tertiary shadow-inner"
					>
						<span class="material-symbols-outlined">payments</span>
					</div>
					<span
						class="rounded-lg bg-tertiary/10 px-2 py-1 text-[10px] font-black tracking-widest text-tertiary uppercase"
						>Inflow</span
					>
				</div>
				<p class="mb-1 text-[10px] font-black tracking-[0.2em] text-on-surface-variant uppercase">
					Today's Revenue
				</p>
				<h3 class="font-serif text-3xl font-black tracking-tighter text-on-surface">
					₱{reportsState.totalRevenue.toLocaleString()}
				</h3>
			</ArtisanalCard>

			<!-- Inventory Health -->
			<ArtisanalCard
				level="lowest"
				class="group relative overflow-hidden border border-outline-variant/10 shadow-sm"
			>
				<div class="mb-6 flex items-center justify-between">
					<div
						class="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/10 text-secondary shadow-inner"
					>
						<span class="material-symbols-outlined">inventory_2</span>
					</div>
					<span
						class="rounded-lg bg-secondary/10 px-2 py-1 text-[10px] font-black tracking-widest text-secondary uppercase"
						>Assets</span
					>
				</div>
				<p class="mb-1 text-[10px] font-black tracking-[0.2em] text-on-surface-variant uppercase">
					Inventory Value
				</p>
				<h3 class="font-serif text-3xl font-black tracking-tighter text-on-surface">
					₱{reportsState.inventoryValue.toLocaleString()}
				</h3>
			</ArtisanalCard>

			<!-- Labor Productivity -->
			<ArtisanalCard
				level="lowest"
				class="group relative overflow-hidden border border-outline-variant/10 shadow-sm"
			>
				<div class="mb-6 flex items-center justify-between">
					<div
						class="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner"
					>
						<span class="material-symbols-outlined">groups</span>
					</div>
					<span
						class="rounded-lg bg-primary/10 px-2 py-1 text-[10px] font-black tracking-widest text-primary uppercase"
						>Staff</span
					>
				</div>
				<p class="mb-1 text-[10px] font-black tracking-[0.2em] text-on-surface-variant uppercase">
					Sales / Labor Hour
				</p>
				<h3 class="font-serif text-3xl font-black tracking-tighter text-on-surface">
					₱{reportsState.salesPerLaborHour.toLocaleString(undefined, { maximumFractionDigits: 0 })}
				</h3>
			</ArtisanalCard>
		</div>

		<!-- MIDDLE SECTION: TOP VOLUME VISUAL -->
		<section class="mb-12">
			<div class="mb-8 flex items-center justify-between px-2">
				<h3 class="font-serif text-3xl font-black tracking-tight text-on-surface uppercase">
					Product Yield Ledger
				</h3>
			</div>

			<div class="grid grid-cols-1 items-start gap-8 xl:grid-cols-12">
				<!-- Visual Ranking (Top 5) -->
				<ArtisanalCard
					level="lowest"
					class="border border-outline-variant/10 p-8 shadow-sm xl:col-span-4"
				>
					<h4
						class="mb-8 px-1 text-[10px] font-black tracking-[0.2em] text-on-surface-variant uppercase"
					>
						Top Volume Snapshot
					</h4>
					<div class="space-y-8">
						{#each reportsState.itemSales.slice(0, 5) as item}
							<div class="group cursor-default space-y-3">
								<div class="flex items-end justify-between">
									<div class="flex flex-col">
										<span
											class="text-xs font-black text-on-surface transition-colors group-hover:text-primary"
											>{item.name}</span
										>
										<span
											class="text-[9px] font-bold tracking-widest text-on-surface-variant/50 uppercase"
											>{item.category}</span
										>
									</div>
									<span class="font-serif text-sm font-black text-primary"
										>₱{item.revenue.toLocaleString()}</span
									>
								</div>
								<div class="h-2 w-full overflow-hidden rounded-full bg-surface-container">
									<div
										class="h-full rounded-full bg-primary shadow-[0_0_12px_rgba(var(--color-primary),0.3)] transition-all duration-1000"
										style="width: {(item.revenue / maxItemRevenue) * 100}%"
									></div>
								</div>
								<div class="flex justify-end">
									<span
										class="text-[9px] font-black tracking-tighter text-on-surface-variant uppercase"
										>{item.quantity} units sold</span
									>
								</div>
							</div>
						{/each}
						{#if reportsState.itemSales.length === 0}
							<div class="flex flex-col items-center py-12 text-center opacity-30">
								<span class="material-symbols-outlined mb-2 text-4xl">analytics</span>
								<p class="text-[10px] font-black tracking-widest uppercase">No Sales Data</p>
							</div>
						{/if}
					</div>
				</ArtisanalCard>

				<!-- Complete Item Table -->
				<ArtisanalCard
					level="lowest"
					class="overflow-hidden border border-outline-variant/10 p-0 shadow-sm xl:col-span-8"
				>
					<PaginatedTable
						items={reportsState.itemSales}
						pageSize={10}
						tableClass="w-full border-collapse text-left"
						emptyMessage="No individual item sales detected for this period."
					>
						{#snippet header()}
							<tr
								class="bg-surface-container text-[10px] font-black tracking-[0.2em] text-on-surface-variant uppercase"
							>
								<th class="px-8 py-6">Product Details</th>
								<th class="px-8 py-6">Category</th>
								<th class="px-8 py-6 text-center">Qty Sold</th>
								<th class="px-8 py-6 text-right">Total Yield</th>
							</tr>
						{/snippet}
						{#snippet row(item)}
							<tr
								class="group border-b border-outline-variant/5 transition-colors hover:bg-surface-container-low/40"
							>
								<td class="px-8 py-6">
									<div class="flex items-center gap-4">
										<div
											class="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/10 bg-primary/5 font-serif text-[10px] font-black text-primary"
										>
											{item.name.substring(0, 2).toUpperCase()}
										</div>
										<span class="text-sm font-black text-on-surface">{item.name}</span>
									</div>
								</td>
								<td class="px-8 py-6">
									<span
										class="rounded-full bg-surface-container-high px-3 py-1 text-[9px] font-black tracking-widest text-on-surface-variant/70 uppercase"
									>
										{item.category}
									</span>
								</td>
								<td class="px-8 py-6 text-center text-sm font-bold text-on-surface">
									{item.quantity.toLocaleString()}
								</td>
								<td
									class="px-8 py-6 text-right font-serif text-lg font-black tracking-tighter text-primary"
								>
									₱{item.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
								</td>
							</tr>
						{/snippet}
					</PaginatedTable>
				</ArtisanalCard>
			</div>
		</section>

		<!-- BOTTOM SECTION: RECENT THROUGHPUT -->
		<section class="mb-12">
			<div class="mb-8 flex items-center justify-between px-2">
				<div>
					<h3 class="font-serif text-3xl font-black tracking-tight text-on-surface uppercase">
						Terminal Throughput
					</h3>
					<p class="mt-1 text-xs font-bold tracking-widest text-on-surface-variant uppercase">
						Verified log of today's terminal activity
					</p>
				</div>
			</div>

			<ArtisanalCard
				level="lowest"
				class="overflow-hidden border border-outline-variant/10 p-0 shadow-sm"
			>
				<PaginatedTable
					items={reportsState.recentOrders}
					pageSize={10}
					tableClass="w-full border-collapse text-left"
					emptyMessage="No throughput detected for this cycle."
				>
					{#snippet header()}
						<tr
							class="bg-surface-container text-[10px] font-black tracking-[0.2em] text-on-surface-variant uppercase"
						>
							<th class="px-8 py-6">Transaction ID</th>
							<th class="px-8 py-6">Timestamp</th>
							<th class="px-8 py-6">Operator</th>
							<th class="px-8 py-6 text-right">Yield</th>
							<th class="px-8 py-6 text-center">Status</th>
							<th class="px-8 py-6 text-right">Audit</th>
						</tr>
					{/snippet}
					{#snippet row(order)}
						<tr
							class="group cursor-pointer border-b border-outline-variant/5 transition-colors hover:bg-surface-container-low/40"
						>
							<td class="px-8 py-6">
								<span class="text-xs font-black tracking-widest text-on-surface uppercase"
									>#TXN-{order.id.substring(0, 8)}</span
								>
							</td>
							<td class="px-8 py-6">
								<div class="flex flex-col">
									<span class="text-sm font-bold text-on-surface"
										>{new Date(order.created).toLocaleTimeString([], {
											hour: '2-digit',
											minute: '2-digit'
										})}</span
									>
									<span
										class="text-[9px] font-black tracking-widest text-on-surface-variant uppercase opacity-60"
										>{new Date(order.created).toLocaleDateString()}</span
									>
								</div>
							</td>
							<td class="px-8 py-6">
								<div class="flex items-center gap-3">
									<div
										class="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/10 bg-primary/5 text-[10px] font-black text-primary uppercase shadow-inner"
									>
										{order.expand?.cashier?.name?.substring(0, 2) || 'US'}
									</div>
									<span class="text-sm font-bold text-on-surface"
										>{order.expand?.cashier?.name || 'Staff'}</span
									>
								</div>
							</td>
							<td class="px-8 py-6 text-right">
								<span class="font-serif text-xl font-black tracking-tighter text-primary"
									>₱{order.total.toLocaleString()}</span
								>
							</td>
							<td class="px-8 py-6 text-center">
								<span
									class="inline-flex items-center rounded-lg border border-tertiary/10 bg-tertiary-container/30 px-3 py-1 text-[9px] font-black tracking-[0.2em] text-tertiary uppercase"
								>
									{order.status}
								</span>
							</td>
							<td class="px-8 py-6 text-right">
								<button
									class="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-surface-container text-on-surface-variant shadow-sm transition-all hover:bg-primary hover:text-on-primary active:scale-90"
								>
									<span class="material-symbols-outlined text-lg">arrow_forward</span>
								</button>
							</td>
						</tr>
					{/snippet}
				</PaginatedTable>
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
</style>
